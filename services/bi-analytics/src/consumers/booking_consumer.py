import json
import threading
import time
import httpx
import pika
from src.config.settings import settings
from src.config.database import SessionLocal
from src.models.analytics_model import BookingMetricRecord


def _enrich_experience_metadata(experience_id: int) -> tuple[int, str]:
    # Consultar proveedor y categoria de la experiencia en catalog-service
    try:
        response = httpx.get(f"{settings.catalog_service_url}/experiences/", timeout=4.0)
        if response.status_code == 200:
            for exp in response.json():
                if exp.get("id") == experience_id:
                    return exp.get("provider_id", 0), exp.get("category", "General")
    except Exception:
        pass
    return 0, "General"


def _handle_booking_confirmed(ch, method, properties, body) -> None:
    # Procesar mensaje de reserva confirmada y persistir metrica en PostgreSQL
    db = SessionLocal()
    try:
        payload = json.loads(body.decode("utf-8"))
        booking_id = payload.get("booking_id")

        if not db.query(BookingMetricRecord).filter(BookingMetricRecord.booking_id == booking_id).first():
            provider_id, category = _enrich_experience_metadata(payload.get("experience_id"))
            record = BookingMetricRecord(
                booking_id=booking_id,
                tourist_id=payload.get("tourist_id"),
                experience_id=payload.get("experience_id"),
                provider_id=provider_id,
                category=category,
                guests_count=payload.get("guests_count", 1),
                total_amount=payload.get("total_amount", 0.0),
                impact_contribution=payload.get("impact_contribution", 0.0)
            )
            db.add(record)
            db.commit()

        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception:
        db.rollback()
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    finally:
        db.close()


def _consume_loop() -> None:
    # Mantener conexion resiliente con RabbitMQ escuchando eventos de reservas
    while True:
        try:
            params = pika.URLParameters(settings.rabbitmq_url)
            connection = pika.BlockingConnection(params)
            channel = connection.channel()
            channel.exchange_declare(exchange="ts_events", exchange_type="topic", durable=True)
            channel.queue_declare(queue="bi_booking_metrics_queue", durable=True)
            channel.queue_bind(
                exchange="ts_events",
                queue="bi_booking_metrics_queue",
                routing_key="booking.confirmed"
            )
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(
                queue="bi_booking_metrics_queue",
                on_message_callback=_handle_booking_confirmed
            )
            channel.start_consuming()
        except Exception:
            time.sleep(5)


def start_consumer_thread() -> None:
    # Iniciar hilo secundario para consumo asincrono sin bloquear FastAPI
    thread = threading.Thread(target=_consume_loop, daemon=True)
    thread.start()