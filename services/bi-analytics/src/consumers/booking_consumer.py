import json
import logging
import threading
import time
from typing import Optional
import httpx
import pika
from pika.exceptions import ChannelClosedByBroker
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.exc import SQLAlchemyError
from src.config.settings import settings
from src.config.database import SessionLocal
from src.models.analytics_model import BookingMetricRecord

logger = logging.getLogger(__name__)


class BookingConfirmedEvent(BaseModel):
    booking_id: int = Field(gt=0)
    tourist_id: int = Field(gt=0)
    experience_id: int = Field(gt=0)
    guests_count: int = Field(default=1, gt=0)
    total_amount: float = Field(ge=0)
    impact_contribution: float = Field(default=0.0, ge=0)
    provider_id: Optional[int] = Field(default=None, ge=0)
    category: Optional[str] = Field(default=None, max_length=50)


def _enrich_experience_metadata(experience_id: int) -> tuple[int, str]:
    # Consultar proveedor y categoria de la experiencia en catalog-service
    try:
        response = httpx.get(
            f"{settings.catalog_service_url}/experiences/{experience_id}",
            params={"include_inactive": "true"},
            timeout=4.0,
        )
        if response.status_code == 200:
            exp = response.json()
            return int(exp.get("provider_id") or 0), str(exp.get("category") or "General")
        logger.warning(
            "Catalog-service respondio %s al consultar experiencia %s",
            response.status_code,
            experience_id,
        )
    except Exception as exc:
        logger.warning("Error consultando metadata de experiencia %s: %s", experience_id, exc)
    return 0, "General"


def _handle_booking_confirmed(ch, method, properties, body) -> None:
    # Procesar mensaje de reserva confirmada y persistir metrica en PostgreSQL
    db = SessionLocal()
    try:
        payload = json.loads(body.decode("utf-8"))
        event = BookingConfirmedEvent(**payload)

        if not db.query(BookingMetricRecord).filter(
            BookingMetricRecord.booking_id == event.booking_id
        ).first():
            if event.provider_id and event.provider_id > 0 and event.category:
                provider_id = event.provider_id
                category = event.category
            else:
                fetched_provider_id, fetched_category = _enrich_experience_metadata(event.experience_id)
                provider_id = event.provider_id if (event.provider_id and event.provider_id > 0) else fetched_provider_id
                category = event.category if event.category else fetched_category

            record = BookingMetricRecord(
                booking_id=event.booking_id,
                tourist_id=event.tourist_id,
                experience_id=event.experience_id,
                provider_id=provider_id,
                category=category,
                guests_count=event.guests_count,
                total_amount=event.total_amount,
                impact_contribution=event.impact_contribution,
            )
            db.add(record)
            db.commit()

        ch.basic_ack(delivery_tag=method.delivery_tag)
    except (json.JSONDecodeError, UnicodeDecodeError, ValidationError) as exc:
        db.rollback()
        logger.error("Payload invalido en booking.confirmed, enviando a DLQ: %s", exc)
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.error("Error transitorio de BD procesando booking.confirmed, reencolando: %s", exc)
        time.sleep(1)
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
    except Exception as exc:
        db.rollback()
        logger.exception("Error inesperado procesando booking.confirmed, enviando a DLQ: %s", exc)
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    finally:
        db.close()


def _declare_topology(connection: pika.BlockingConnection):
    # Declarar exchanges, cola principal con DLX/DLQ y manejo de colas preexistentes
    channel = connection.channel()
    channel.exchange_declare(exchange="ts_events", exchange_type="topic", durable=True)
    channel.exchange_declare(exchange="ts_events_dlx", exchange_type="direct", durable=True)
    channel.queue_declare(queue="bi_booking_metrics_dlq", durable=True)
    channel.queue_bind(
        exchange="ts_events_dlx",
        queue="bi_booking_metrics_dlq",
        routing_key="booking.confirmed.dlq",
    )

    try:
        channel.queue_declare(
            queue="bi_booking_metrics_queue",
            durable=True,
            arguments={
                "x-dead-letter-exchange": "ts_events_dlx",
                "x-dead-letter-routing-key": "booking.confirmed.dlq",
            },
        )
    except ChannelClosedByBroker as exc:
        if exc.reply_code == 406:
            logger.warning(
                "Cola bi_booking_metrics_queue existente sin argumentos DLX (PRECONDITION_FAILED); "
                "usando declaracion compatible"
            )
            channel = connection.channel()
            channel.queue_declare(queue="bi_booking_metrics_queue", durable=True)
        else:
            raise

    channel.queue_bind(
        exchange="ts_events",
        queue="bi_booking_metrics_queue",
        routing_key="booking.confirmed",
    )
    return channel


def _consume_loop(stop_event: threading.Event) -> None:
    # Mantener conexion resiliente con RabbitMQ escuchando eventos de reservas
    while not stop_event.is_set():
        connection = None
        try:
            params = pika.URLParameters(settings.rabbitmq_url)
            connection = pika.BlockingConnection(params)
            channel = _declare_topology(connection)
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(
                queue="bi_booking_metrics_queue",
                on_message_callback=_handle_booking_confirmed,
            )
            while not stop_event.is_set():
                connection.process_data_events(time_limit=1)
        except Exception as exc:
            if not stop_event.is_set():
                logger.warning("Error en consumidor RabbitMQ, reintentando en 5s: %s", exc)
                stop_event.wait(5)
        finally:
            if connection and not connection.is_closed:
                try:
                    connection.close()
                except Exception as close_exc:
                    logger.warning("Error cerrando conexion RabbitMQ: %s", close_exc)


def start_consumer_thread(stop_event: Optional[threading.Event] = None) -> threading.Thread:
    # Iniciar hilo secundario para consumo asincrono sin bloquear FastAPI
    event = stop_event or threading.Event()
    thread = threading.Thread(target=_consume_loop, args=(event,), daemon=True)
    thread.start()
    return thread