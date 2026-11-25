from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
import logging
from time import perf_counter
import httpx
from sqlalchemy import func
from sqlalchemy.orm import Session
from src.config.settings import settings
from src.models.analytics_model import BookingMetricRecord

logger = logging.getLogger(__name__)


def _build_daily_trend(
    db: Session,
    provider_id: int | None = None,
    days: int = 14,
) -> list[dict]:
    """Build a continuous daily time series for the last `days` UTC days."""
    today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=days - 1)
    start_dt = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)

    day_expr = func.date(BookingMetricRecord.recorded_at)
    query = db.query(
        day_expr.label("day"),
        func.count(BookingMetricRecord.id).label("bookings_count"),
        func.coalesce(func.sum(BookingMetricRecord.total_amount), 0.0).label("revenue"),
        func.coalesce(func.sum(BookingMetricRecord.impact_contribution), 0.0).label("impact_fund"),
        func.coalesce(func.sum(BookingMetricRecord.guests_count), 0).label("tourists"),
    ).filter(BookingMetricRecord.recorded_at >= start_dt)

    if provider_id is not None:
        query = query.filter(BookingMetricRecord.provider_id == provider_id)

    rows = query.group_by(day_expr).all()
    by_day: dict[str, dict] = {}
    for row in rows:
        day_key = str(row.day)[:10]
        by_day[day_key] = {
            "bookings_count": int(row.bookings_count or 0),
            "revenue": round(float(row.revenue or 0.0), 2),
            "impact_fund": round(float(row.impact_fund or 0.0), 2),
            "tourists": int(row.tourists or 0),
        }

    trend: list[dict] = []
    for offset in range(days):
        current_day = (start_date + timedelta(days=offset)).isoformat()
        point = by_day.get(current_day, {
            "bookings_count": 0,
            "revenue": 0.0,
            "impact_fund": 0.0,
            "tourists": 0,
        })
        trend.append({"date": current_day, **point})
    return trend


def _fetch_catalog_experiences() -> list[dict]:
    """Fetch active catalog experiences from catalog-service with graceful fallback."""
    try:
        response = httpx.get(
            f"{settings.catalog_service_url}/experiences/",
            params={"limit": 200},
            timeout=3.0,
        )
        if response.status_code == 200:
            data = response.json()
            return data if isinstance(data, list) else []
    except Exception as exc:
        logger.warning("No se pudo consultar catalog-service para analitica: %s", exc)
    return []


def _fetch_experience_metadata(experience_id: int) -> dict | None:
    """Fetch single experience metadata including inactive experiences."""
    try:
        response = httpx.get(
            f"{settings.catalog_service_url}/experiences/{experience_id}",
            params={"include_inactive": "true"},
            timeout=2.0,
        )
        if response.status_code == 200:
            data = response.json()
            return data if isinstance(data, dict) else None
    except Exception as exc:
        logger.warning("Error consultando experiencia %s en catalog-service: %s", experience_id, exc)
    return None


def _probe_service_health(name: str, base_url: str) -> dict:
    start = perf_counter()
    try:
        response = httpx.get(f"{base_url}/health", timeout=1.2)
        latency_ms = round((perf_counter() - start) * 1000)
        return {
            "service": name,
            "status": "UP" if response.status_code == 200 else "DEGRADED",
            "latency_ms": latency_ms,
        }
    except Exception:
        return {
            "service": name,
            "status": "DEGRADED",
            "latency_ms": None,
        }


def _check_services_health() -> list[dict]:
    """Probe health endpoints across platform microservices concurrently."""
    targets = [
        ("auth-users", settings.auth_service_url),
        ("catalog-audit", settings.catalog_service_url),
        ("booking-payment", settings.booking_service_url),
        ("social-chat", settings.social_service_url),
        ("ai-recommender", settings.ai_service_url),
    ]
    results: list[dict] = []
    with ThreadPoolExecutor(max_workers=len(targets)) as executor:
        futures = [executor.submit(_probe_service_health, name, url) for name, url in targets]
        for fut in futures:
            results.append(fut.result())
    results.append({"service": "bi-analytics", "status": "UP", "latency_ms": 0})
    return results


def get_admin_bi_dashboard(db: Session) -> dict:
    """Compute consolidated platform KPIs, trends, catalog breakdown, and service health."""
    totals = db.query(
        func.count(BookingMetricRecord.id).label("total_bookings"),
        func.coalesce(func.sum(BookingMetricRecord.total_amount), 0.0).label("total_revenue"),
        func.coalesce(func.sum(BookingMetricRecord.impact_contribution), 0.0).label("total_impact_fund"),
        func.coalesce(func.sum(BookingMetricRecord.guests_count), 0).label("total_tourists_mobilized"),
        func.count(func.distinct(BookingMetricRecord.tourist_id)).label("unique_tourists"),
        func.count(func.distinct(BookingMetricRecord.experience_id)).label("active_experiences_booked"),
    ).first()

    total_bookings = int(totals.total_bookings or 0)
    total_revenue = round(float(totals.total_revenue or 0.0), 2)
    total_impact_fund = round(float(totals.total_impact_fund or 0.0), 2)
    total_tourists = int(totals.total_tourists_mobilized or 0)
    unique_tourists = int(totals.unique_tourists or 0)
    active_experiences_booked = int(totals.active_experiences_booked or 0)

    active_providers_with_bookings = int(
        db.query(func.count(func.distinct(BookingMetricRecord.provider_id)))
        .filter(BookingMetricRecord.provider_id > 0)
        .scalar()
        or 0
    )

    repeat_tourists_count = (
        db.query(BookingMetricRecord.tourist_id)
        .group_by(BookingMetricRecord.tourist_id)
        .having(func.count(BookingMetricRecord.id) >= 2)
        .count()
    )
    repeat_tourist_rate = (
        round((repeat_tourists_count / unique_tourists) * 100, 1)
        if unique_tourists > 0
        else 0.0
    )

    avg_ticket = round(total_revenue / total_bookings, 2) if total_bookings > 0 else 0.0
    avg_group_size = round(total_tourists / total_bookings, 2) if total_bookings > 0 else 0.0
    avg_impact_per_tourist = round(total_impact_fund / total_tourists, 2) if total_tourists > 0 else 0.0

    # Group bookings, tourists, impact fund, and revenue by category
    category_rows = db.query(
        BookingMetricRecord.category,
        func.count(BookingMetricRecord.id).label("bookings_count"),
        func.coalesce(func.sum(BookingMetricRecord.total_amount), 0.0).label("revenue"),
        func.coalesce(func.sum(BookingMetricRecord.impact_contribution), 0.0).label("impact_fund"),
        func.coalesce(func.sum(BookingMetricRecord.guests_count), 0).label("tourists"),
    ).group_by(BookingMetricRecord.category).order_by(func.count(BookingMetricRecord.id).desc()).all()

    by_category = []
    for row in category_rows:
        rev = round(float(row.revenue or 0.0), 2)
        share = round((rev / total_revenue) * 100, 1) if total_revenue > 0 else 0.0
        by_category.append({
            "category": row.category,
            "bookings_count": int(row.bookings_count or 0),
            "tourists": int(row.tourists or 0),
            "revenue": rev,
            "impact_fund": round(float(row.impact_fund or 0.0), 2),
            "revenue_share_pct": share,
        })

    # Ranking of top providers
    top_providers_rows = db.query(
        BookingMetricRecord.provider_id,
        func.count(BookingMetricRecord.id).label("bookings_count"),
        func.coalesce(func.sum(BookingMetricRecord.total_amount), 0.0).label("revenue"),
        func.coalesce(func.sum(BookingMetricRecord.impact_contribution), 0.0).label("impact_fund"),
        func.coalesce(func.sum(BookingMetricRecord.guests_count), 0).label("tourists"),
    ).filter(BookingMetricRecord.provider_id > 0).group_by(
        BookingMetricRecord.provider_id
    ).order_by(func.sum(BookingMetricRecord.total_amount).desc(), func.count(BookingMetricRecord.id).desc()).limit(5).all()

    top_providers = []
    for row in top_providers_rows:
        cnt = int(row.bookings_count or 0)
        rev = round(float(row.revenue or 0.0), 2)
        top_providers.append({
            "provider_id": row.provider_id,
            "bookings_count": cnt,
            "tourists": int(row.tourists or 0),
            "revenue": rev,
            "impact_fund": round(float(row.impact_fund or 0.0), 2),
            "avg_ticket": round(rev / cnt, 2) if cnt > 0 else 0.0,
        })

    # Fetch catalog data to enrich top experiences and platform-wide analysis
    catalog_experiences = _fetch_catalog_experiences()
    catalog_map = {int(exp["id"]): exp for exp in catalog_experiences if "id" in exp}

    exp_metric_rows = db.query(
        BookingMetricRecord.experience_id,
        func.max(BookingMetricRecord.category).label("category"),
        func.count(BookingMetricRecord.id).label("bookings_count"),
        func.coalesce(func.sum(BookingMetricRecord.guests_count), 0).label("tourists"),
        func.coalesce(func.sum(BookingMetricRecord.total_amount), 0.0).label("revenue"),
        func.coalesce(func.sum(BookingMetricRecord.impact_contribution), 0.0).label("impact_fund"),
    ).group_by(BookingMetricRecord.experience_id).order_by(
        func.sum(BookingMetricRecord.total_amount).desc(),
        func.count(BookingMetricRecord.id).desc(),
    ).all()

    exp_stats_map: dict[int, dict] = {}
    top_experiences: list[dict] = []
    for row in exp_metric_rows:
        exp_id = int(row.experience_id)
        cat_exp = catalog_map.get(exp_id)
        if not cat_exp:
            cat_exp = _fetch_experience_metadata(exp_id)
        stats = {
            "experience_id": exp_id,
            "title": cat_exp.get("title") if cat_exp else f"Experiencia #{exp_id}",
            "category": (cat_exp.get("category") if cat_exp else row.category) or "General",
            "borough_cdmx": (cat_exp.get("borough_cdmx") if cat_exp else "CDMX") or "CDMX",
            "bookings_count": int(row.bookings_count or 0),
            "tourists": int(row.tourists or 0),
            "revenue": round(float(row.revenue or 0.0), 2),
            "impact_fund": round(float(row.impact_fund or 0.0), 2),
        }
        exp_stats_map[exp_id] = stats
        if len(top_experiences) < 6:
            top_experiences.append(stats)

    # Platform catalog overview and CDMX borough analysis
    total_active_experiences = len(catalog_experiences)
    catalog_providers = {
        int(exp["provider_id"])
        for exp in catalog_experiences
        if exp.get("provider_id")
    }
    pet_friendly_count = sum(1 for exp in catalog_experiences if exp.get("pet_friendly"))
    accessible_count = sum(1 for exp in catalog_experiences if exp.get("accessible"))
    total_ecological_capacity = sum(int(exp.get("max_capacity") or 0) for exp in catalog_experiences)
    avg_catalog_price = (
        round(
            sum(float(exp.get("price") or 0.0) for exp in catalog_experiences) / total_active_experiences,
            2,
        )
        if total_active_experiences > 0
        else 0.0
    )

    borough_agg: dict[str, dict] = defaultdict(lambda: {
        "experiences_count": 0,
        "bookings_count": 0,
        "revenue": 0.0,
        "tourists": 0,
    })
    catalog_cat_agg: dict[str, dict] = defaultdict(lambda: {
        "experiences_count": 0,
        "price_sum": 0.0,
    })

    for exp in catalog_experiences:
        borough = str(exp.get("borough_cdmx") or "CDMX")
        cat = str(exp.get("category") or "General")
        borough_agg[borough]["experiences_count"] += 1
        catalog_cat_agg[cat]["experiences_count"] += 1
        catalog_cat_agg[cat]["price_sum"] += float(exp.get("price") or 0.0)

        exp_stats = exp_stats_map.get(int(exp["id"]))
        if exp_stats:
            borough_agg[borough]["bookings_count"] += exp_stats["bookings_count"]
            borough_agg[borough]["revenue"] = round(
                borough_agg[borough]["revenue"] + exp_stats["revenue"], 2
            )
            borough_agg[borough]["tourists"] += exp_stats["tourists"]

    by_borough = [
        {"borough": borough, **vals}
        for borough, vals in sorted(
            borough_agg.items(),
            key=lambda item: (item[1]["bookings_count"], item[1]["experiences_count"]),
            reverse=True,
        )
    ]

    catalog_by_category = [
        {
            "category": cat,
            "experiences_count": vals["experiences_count"],
            "avg_price": round(vals["price_sum"] / vals["experiences_count"], 2)
            if vals["experiences_count"] > 0
            else 0.0,
        }
        for cat, vals in sorted(
            catalog_cat_agg.items(),
            key=lambda item: item[1]["experiences_count"],
            reverse=True,
        )
    ]

    return {
        "kpis": {
            "total_bookings": total_bookings,
            "total_revenue": total_revenue,
            "total_impact_fund": total_impact_fund,
            "total_tourists_mobilized": total_tourists,
            "avg_ticket": avg_ticket,
            "avg_group_size": avg_group_size,
            "avg_impact_per_tourist": avg_impact_per_tourist,
            "unique_tourists": unique_tourists,
            "repeat_tourist_rate": repeat_tourist_rate,
            "active_providers_with_bookings": active_providers_with_bookings,
            "active_experiences_booked": active_experiences_booked,
        },
        "by_category": by_category,
        "top_providers": top_providers,
        "top_experiences": top_experiences,
        "daily_trend": _build_daily_trend(db, days=14),
        "platform_overview": {
            "total_active_experiences": total_active_experiences,
            "total_catalog_providers": len(catalog_providers),
            "pet_friendly_count": pet_friendly_count,
            "pet_friendly_pct": round((pet_friendly_count / total_active_experiences) * 100, 1)
            if total_active_experiences > 0
            else 0.0,
            "accessible_count": accessible_count,
            "accessible_pct": round((accessible_count / total_active_experiences) * 100, 1)
            if total_active_experiences > 0
            else 0.0,
            "avg_catalog_price": avg_catalog_price,
            "total_ecological_capacity": total_ecological_capacity,
            "by_borough": by_borough,
            "catalog_by_category": catalog_by_category,
        },
        "service_health": _check_services_health(),
    }


def get_provider_bi_dashboard(db: Session, provider_id: int) -> dict:
    """Compute BI monitoring metrics strictly scoped to a single provider."""
    totals = db.query(
        func.count(BookingMetricRecord.id).label("total_bookings"),
        func.coalesce(func.sum(BookingMetricRecord.total_amount), 0.0).label("total_revenue"),
        func.coalesce(func.sum(BookingMetricRecord.impact_contribution), 0.0).label("total_impact_fund"),
        func.coalesce(func.sum(BookingMetricRecord.guests_count), 0).label("total_tourists"),
        func.count(func.distinct(BookingMetricRecord.tourist_id)).label("unique_tourists"),
    ).filter(BookingMetricRecord.provider_id == provider_id).first()

    total_bookings = int(totals.total_bookings or 0)
    total_revenue = round(float(totals.total_revenue or 0.0), 2)
    total_impact_fund = round(float(totals.total_impact_fund or 0.0), 2)
    total_tourists = int(totals.total_tourists or 0)
    unique_tourists = int(totals.unique_tourists or 0)

    exp_rows = db.query(
        BookingMetricRecord.experience_id,
        func.max(BookingMetricRecord.category).label("category"),
        func.count(BookingMetricRecord.id).label("bookings_count"),
        func.coalesce(func.sum(BookingMetricRecord.guests_count), 0).label("tourists"),
        func.coalesce(func.sum(BookingMetricRecord.total_amount), 0.0).label("revenue"),
        func.coalesce(func.sum(BookingMetricRecord.impact_contribution), 0.0).label("impact_fund"),
        func.max(BookingMetricRecord.recorded_at).label("last_booking_at"),
    ).filter(
        BookingMetricRecord.provider_id == provider_id
    ).group_by(
        BookingMetricRecord.experience_id
    ).order_by(func.sum(BookingMetricRecord.total_amount).desc()).all()

    by_experience: list[dict] = []
    for row in exp_rows:
        exp_id = int(row.experience_id)
        meta = _fetch_experience_metadata(exp_id)
        cnt = int(row.bookings_count or 0)
        tourists_cnt = int(row.tourists or 0)
        by_experience.append({
            "experience_id": exp_id,
            "title": meta.get("title") if meta else f"Servicio #{exp_id}",
            "category": (meta.get("category") if meta else row.category) or "General",
            "borough_cdmx": (meta.get("borough_cdmx") if meta else "CDMX") or "CDMX",
            "is_active": bool(meta.get("is_active")) if meta else True,
            "max_capacity": int(meta.get("max_capacity") or 0) if meta else 0,
            "price": float(meta.get("price") or 0.0) if meta else 0.0,
            "bookings_count": cnt,
            "tourists": tourists_cnt,
            "avg_group_size": round(tourists_cnt / cnt, 2) if cnt > 0 else 0.0,
            "revenue": round(float(row.revenue or 0.0), 2),
            "impact_fund": round(float(row.impact_fund or 0.0), 2),
            "last_booking_at": row.last_booking_at.isoformat() if row.last_booking_at else None,
        })

    category_rows = db.query(
        BookingMetricRecord.category,
        func.count(BookingMetricRecord.id).label("bookings_count"),
        func.coalesce(func.sum(BookingMetricRecord.guests_count), 0).label("tourists"),
        func.coalesce(func.sum(BookingMetricRecord.total_amount), 0.0).label("revenue"),
    ).filter(
        BookingMetricRecord.provider_id == provider_id
    ).group_by(BookingMetricRecord.category).all()

    by_category = [
        {
            "category": row.category,
            "bookings_count": int(row.bookings_count or 0),
            "tourists": int(row.tourists or 0),
            "revenue": round(float(row.revenue or 0.0), 2),
        }
        for row in category_rows
    ]

    recent_rows = (
        db.query(BookingMetricRecord)
        .filter(BookingMetricRecord.provider_id == provider_id)
        .order_by(BookingMetricRecord.recorded_at.desc(), BookingMetricRecord.id.desc())
        .limit(10)
        .all()
    )
    recent_bookings = [
        {
            "booking_id": rec.booking_id,
            "experience_id": rec.experience_id,
            "category": rec.category,
            "guests_count": rec.guests_count,
            "total_amount": round(float(rec.total_amount), 2),
            "impact_contribution": round(float(rec.impact_contribution), 2),
            "recorded_at": rec.recorded_at.isoformat() if rec.recorded_at else None,
        }
        for rec in recent_rows
    ]

    return {
        "provider_id": provider_id,
        "kpis": {
            "total_bookings": total_bookings,
            "total_revenue": total_revenue,
            "total_impact_fund": total_impact_fund,
            "total_tourists": total_tourists,
            "avg_ticket": round(total_revenue / total_bookings, 2) if total_bookings > 0 else 0.0,
            "avg_group_size": round(total_tourists / total_bookings, 2) if total_bookings > 0 else 0.0,
            "unique_tourists": unique_tourists,
        },
        "daily_trend": _build_daily_trend(db, provider_id=provider_id, days=14),
        "by_experience": by_experience,
        "by_category": by_category,
        "recent_bookings": recent_bookings,
    }
