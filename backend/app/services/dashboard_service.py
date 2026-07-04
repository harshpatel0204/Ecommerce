"""Admin dashboard aggregations."""
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order
from app.models.product import Product, ProductVariant
from app.models.user import User

_PAID = ("paid", "processing", "packed", "shipped", "out_for_delivery", "delivered")


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def get_stats(db: AsyncSession) -> dict:
    now = _now()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = today.replace(day=1)

    revenue_expr = func.coalesce(func.sum(Order.total_amount), 0)
    paid = Order.payment_status == "paid"

    revenue_total = await db.scalar(select(revenue_expr).where(paid))
    revenue_today = await db.scalar(select(revenue_expr).where(paid, Order.paid_at >= today))
    revenue_month = await db.scalar(select(revenue_expr).where(paid, Order.paid_at >= month_start))

    orders_today = await db.scalar(select(func.count(Order.id)).where(Order.placed_at >= today))
    orders_month = await db.scalar(select(func.count(Order.id)).where(Order.placed_at >= month_start))
    orders_pending = await db.scalar(select(func.count(Order.id)).where(Order.status == "paid"))
    orders_shipped = await db.scalar(
        select(func.count(Order.id)).where(Order.status.in_(("shipped", "out_for_delivery")))
    )

    products_total = await db.scalar(select(func.count(Product.id)).where(Product.is_active.is_(True)))
    low_stock = await db.scalar(
        select(func.count(ProductVariant.id)).where(
            ProductVariant.is_active.is_(True),
            ProductVariant.stock_quantity < ProductVariant.low_stock_threshold,
        )
    )
    customers_total = await db.scalar(select(func.count(User.id)).where(User.is_admin.is_(False)))
    customers_new = await db.scalar(
        select(func.count(User.id)).where(User.is_admin.is_(False), User.created_at >= month_start)
    )

    return {
        "revenue_today": float(revenue_today or 0),
        "revenue_this_month": float(revenue_month or 0),
        "revenue_total": float(revenue_total or 0),
        "orders_today": int(orders_today or 0),
        "orders_this_month": int(orders_month or 0),
        "orders_pending": int(orders_pending or 0),
        "orders_shipped": int(orders_shipped or 0),
        "products_total": int(products_total or 0),
        "low_stock_products": int(low_stock or 0),
        "customers_total": int(customers_total or 0),
        "customers_new_this_month": int(customers_new or 0),
    }


async def get_sales_chart(db: AsyncSession, days: int) -> dict:
    now = _now()
    start = (now - timedelta(days=days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)
    day = func.date(Order.paid_at)
    rows = await db.execute(
        select(
            day.label("d"),
            func.coalesce(func.sum(Order.total_amount), 0),
            func.count(Order.id),
        )
        .where(Order.payment_status == "paid", Order.paid_at >= start)
        .group_by(day)
    )
    by_day = {str(d): (float(rev or 0), int(cnt)) for d, rev, cnt in rows}

    labels, revenue, orders = [], [], []
    for i in range(days):
        d = (start + timedelta(days=i)).date().isoformat()
        rev, cnt = by_day.get(d, (0.0, 0))
        labels.append(d)
        revenue.append(rev)
        orders.append(cnt)
    return {"labels": labels, "revenue": revenue, "orders": orders}


async def get_low_stock(db: AsyncSession) -> list[dict]:
    rows = await db.execute(
        select(
            Product.name,
            ProductVariant.sku,
            ProductVariant.size,
            ProductVariant.color,
            ProductVariant.stock_quantity,
            ProductVariant.low_stock_threshold,
        )
        .join(Product, Product.id == ProductVariant.product_id)
        .where(
            ProductVariant.is_active.is_(True),
            ProductVariant.stock_quantity < ProductVariant.low_stock_threshold,
        )
        .order_by(ProductVariant.stock_quantity)
        .limit(20)
    )
    return [
        {
            "product_name": name,
            "variant_sku": sku,
            "size": size,
            "color": color,
            "stock_quantity": qty,
            "low_stock_threshold": thr,
        }
        for name, sku, size, color, qty, thr in rows
    ]


async def get_recent_orders(db: AsyncSession) -> list[dict]:
    rows = await db.execute(
        select(
            Order.order_number,
            User.full_name,
            Order.total_amount,
            Order.status,
            Order.placed_at,
        )
        .join(User, User.id == Order.user_id, isouter=True)
        .order_by(Order.placed_at.desc())
        .limit(10)
    )
    return [
        {
            "order_number": num,
            "customer_name": name,
            "total_amount": float(total),
            "status": st,
            "placed_at": at,
        }
        for num, name, total, st, at in rows
    ]
