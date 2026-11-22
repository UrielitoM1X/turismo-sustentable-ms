from sqlalchemy.orm import Session
from sqlalchemy import func
from src.models.analytics_model import BookingMetricRecord


def get_admin_bi_dashboard(db: Session) -> dict:
    # Calcular KPIs principales de reservas, ingresos e impacto ecologico
    totals = db.query(
        func.count(BookingMetricRecord.id).label("total_bookings"),
        func.coalesce(func.sum(BookingMetricRecord.total_amount), 0.0).label("total_revenue"),
        func.coalesce(func.sum(BookingMetricRecord.impact_contribution), 0.0).label("total_impact_fund"),
        func.coalesce(func.sum(BookingMetricRecord.guests_count), 0).label("total_tourists_mobilized")
    ).first()

    # Agrupar volumen de reservas e ingresos por categoria
    category_rows = db.query(
        BookingMetricRecord.category,
        func.count(BookingMetricRecord.id).label("bookings_count"),
        func.coalesce(func.sum(BookingMetricRecord.total_amount), 0.0).label("revenue")
    ).group_by(BookingMetricRecord.category).all()

    # Obtener ranking de proveedores activos con mas reservas
    top_providers_rows = db.query(
        BookingMetricRecord.provider_id,
        func.count(BookingMetricRecord.id).label("bookings_count"),
        func.coalesce(func.sum(BookingMetricRecord.total_amount), 0.0).label("revenue")
    ).filter(BookingMetricRecord.provider_id > 0).group_by(
        BookingMetricRecord.provider_id
    ).order_by(func.count(BookingMetricRecord.id).desc()).limit(5).all()

    return {
        "kpis": {
            "total_bookings": totals.total_bookings,
            "total_revenue": round(float(totals.total_revenue), 2),
            "total_impact_fund": round(float(totals.total_impact_fund), 2),
            "total_tourists_mobilized": totals.total_tourists_mobilized
        },
        "by_category": [
            {
                "category": row.category,
                "bookings_count": row.bookings_count,
                "revenue": round(float(row.revenue), 2)
            }
            for row in category_rows
        ],
        "top_providers": [
            {
                "provider_id": row.provider_id,
                "bookings_count": row.bookings_count,
                "revenue": round(float(row.revenue), 2)
            }
            for row in top_providers_rows
        ]
    }