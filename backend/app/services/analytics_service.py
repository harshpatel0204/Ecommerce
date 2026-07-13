"""Admin analytics + reporting aggregations (paid orders only)."""
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderItem
from app.models.product import Category, Product, ProductVariant

_PAID = "paid"


def _start(days: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=days)


async def top_products(db: AsyncSession, days: int, limit: int) -> list[dict]:
    start = _start(days)
    rows = await db.execute(
        select(
            OrderItem.product_name,
            func.sum(OrderItem.quantity),
            func.sum(OrderItem.line_total),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.payment_status == _PAID, Order.paid_at >= start)
        .group_by(OrderItem.product_name)
        .order_by(func.sum(OrderItem.line_total).desc())
        .limit(limit)
    )
    return [
        {"product_name": name, "units_sold": int(units or 0), "revenue": float(rev or 0)}
        for name, units, rev in rows
    ]


async def sales_by_category(db: AsyncSession, days: int) -> list[dict]:
    start = _start(days)
    label = func.coalesce(Category.name, "Uncategorized")
    rows = await db.execute(
        select(label, func.sum(OrderItem.line_total), func.sum(OrderItem.quantity))
        .join(Order, Order.id == OrderItem.order_id)
        .join(ProductVariant, ProductVariant.id == OrderItem.variant_id, isouter=True)
        .join(Product, Product.id == ProductVariant.product_id, isouter=True)
        .join(Category, Category.id == Product.category_id, isouter=True)
        .where(Order.payment_status == _PAID, Order.paid_at >= start)
        .group_by(label)
        .order_by(func.sum(OrderItem.line_total).desc())
    )
    return [
        {"category": cat, "revenue": float(rev or 0), "units": int(units or 0)}
        for cat, rev, units in rows
    ]


async def summary(db: AsyncSession, days: int) -> dict:
    start = _start(days)
    paid = Order.payment_status == _PAID
    revenue = await db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(paid, Order.paid_at >= start)
    )
    orders = await db.scalar(select(func.count(Order.id)).where(paid, Order.paid_at >= start))
    unique = await db.scalar(
        select(func.count(func.distinct(Order.user_id))).where(paid, Order.paid_at >= start)
    )
    rev = float(revenue or 0)
    cnt = int(orders or 0)
    return {
        "revenue": rev,
        "orders": cnt,
        "avg_order_value": round(rev / cnt, 2) if cnt else 0.0,
        "unique_customers": int(unique or 0),
    }


async def orders_for_export(db: AsyncSession, status: str | None, search: str | None) -> list[dict]:
    """Flat rows for the orders CSV export (all matching orders, no pagination)."""
    item_count = (
        select(func.coalesce(func.sum(OrderItem.quantity), 0))
        .where(OrderItem.order_id == Order.id)
        .scalar_subquery()
    )
    stmt = select(
        Order.order_number,
        Order.placed_at,
        Order.status,
        Order.payment_status,
        Order.total_amount,
        item_count,
    ).order_by(Order.placed_at.desc())
    if status:
        stmt = stmt.where(Order.status == status)
    if search:
        stmt = stmt.where(Order.order_number.ilike(f"%{search}%"))
    rows = await db.execute(stmt)
    return [
        {
            "order_number": num,
            "placed_at": at,
            "status": st,
            "payment_status": pay,
            "total_amount": float(total or 0),
            "item_count": int(items or 0),
        }
        for num, at, st, pay, total, items in rows
    ]
