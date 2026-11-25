import json
import logging
import pika
from src.config.settings import settings

logger = logging.getLogger(__name__)


def publish_event(routing_key: str, payload: dict) -> None:
    # Publicar evento asincrono hacia intercambio de eventos del sistema
    connection = None
    try:
        params = pika.URLParameters(settings.rabbitmq_url)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()
        channel.exchange_declare(exchange="ts_events", exchange_type="topic", durable=True)
        channel.confirm_delivery()
        channel.basic_publish(
            exchange="ts_events",
            routing_key=routing_key,
            body=json.dumps(payload),
            properties=pika.BasicProperties(delivery_mode=2)
        )
    except Exception as exc:
        # Evitar caida del flujo transaccional si el broker no responde temporalmente
        logger.error("Error publicando evento '%s' a RabbitMQ: %s", routing_key, exc)
    finally:
        if connection and not connection.is_closed:
            try:
                connection.close()
            except Exception as close_exc:
                logger.error("Error cerrando conexion RabbitMQ: %s", close_exc)