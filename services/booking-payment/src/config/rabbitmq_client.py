import json
import pika
from src.config.settings import settings


def publish_event(routing_key: str, payload: dict) -> None:
    # Publicar evento asincrono hacia intercambio de eventos del sistema
    try:
        params = pika.URLParameters(settings.rabbitmq_url)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()
        channel.exchange_declare(exchange="ts_events", exchange_type="topic", durable=True)
        channel.basic_publish(
            exchange="ts_events",
            routing_key=routing_key,
            body=json.dumps(payload),
            properties=pika.BasicProperties(delivery_mode=2)
        )
        connection.close()
    except Exception:
        # Evitar caida del flujo transaccional si el broker no responde temporalmente
        pass