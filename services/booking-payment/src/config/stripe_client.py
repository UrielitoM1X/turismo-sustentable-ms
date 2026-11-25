from decimal import Decimal, ROUND_HALF_UP
from typing import Any
import stripe
from src.config.settings import settings

_PLACEHOLDER_KEYS = {"", "sk_test_placeholder", "sk_live_placeholder"}


def is_stripe_configured() -> bool:
    key = (settings.stripe_api_key or "").strip()
    if key in _PLACEHOLDER_KEYS:
        return False
    return key.startswith("sk_test_") or key.startswith("sk_live_")


def is_stripe_test_mode() -> bool:
    return (settings.stripe_api_key or "").strip().startswith("sk_test_")


def _to_cents(amount: Decimal | float) -> int:
    cents = (Decimal(str(amount)) * Decimal("100")).quantize(
        Decimal("1"), rounding=ROUND_HALF_UP
    )
    return max(0, int(cents))


def create_checkout_session(
    *,
    booking_id: int,
    tourist_id: int,
    experience_id: int,
    experience_title: str,
    activity_date: str,
    guests_count: int,
    base_amount: float,
    impact_contribution: float,
    frontend_origin: str,
) -> dict[str, Any]:
    stripe.api_key = settings.stripe_api_key.strip()
    origin = (frontend_origin or settings.frontend_url).rstrip("/")

    line_items: list[dict[str, Any]] = [
        {
            "price_data": {
                "currency": "mxn",
                "unit_amount": _to_cents(base_amount),
                "product_data": {
                    "name": experience_title,
                    "description": f"{activity_date} · {guests_count} visitante(s)",
                },
            },
            "quantity": 1,
        }
    ]

    impact_cents = _to_cents(impact_contribution)
    if impact_cents > 0:
        line_items.append(
            {
                "price_data": {
                    "currency": "mxn",
                    "unit_amount": impact_cents,
                    "product_data": {
                        "name": "Fondo de Impacto Ecológico Local (5%)",
                        "description": "Aportación directa a conservación y reforestación en CDMX",
                    },
                },
                "quantity": 1,
            }
        )

    session = stripe.checkout.Session.create(
        mode="payment",
        payment_method_types=["card"],
        line_items=line_items,
        client_reference_id=str(booking_id),
        metadata={
            "booking_id": str(booking_id),
            "tourist_id": str(tourist_id),
            "experience_id": str(experience_id),
        },
        success_url=(
            f"{origin}/reservas?stripe_status=success"
            f"&booking_id={booking_id}&session_id={{CHECKOUT_SESSION_ID}}"
        ),
        cancel_url=f"{origin}/reservas?stripe_status=cancelled&booking_id={booking_id}",
    )

    return {
        "session_id": session.id,
        "checkout_url": session.url,
    }


def retrieve_checkout_session(session_id: str) -> Any:
    stripe.api_key = settings.stripe_api_key.strip()
    return stripe.checkout.Session.retrieve(session_id)


def construct_webhook_event(payload: bytes, sig_header: str) -> Any:
    stripe.api_key = settings.stripe_api_key.strip()
    secret = (settings.stripe_webhook_secret or "").strip()
    if not secret:
        raise ValueError("STRIPE_WEBHOOK_SECRET no configurado")
    return stripe.Webhook.construct_event(payload, sig_header, secret)
