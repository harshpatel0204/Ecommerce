"""Admin dashboard endpoints. All require get_current_admin."""
from fastapi import APIRouter, Depends, Query

from app.core.deps import DbSession, get_current_admin
from app.schemas.admin import DashboardStats, LowStockItem, RecentOrder, SalesChart
from app.services import dashboard_service

router = APIRouter(
    prefix="/admin/dashboard", tags=["admin:dashboard"], dependencies=[Depends(get_current_admin)]
)


@router.get("/stats", response_model=DashboardStats)
async def stats(db: DbSession) -> DashboardStats:
    return DashboardStats(**await dashboard_service.get_stats(db))


@router.get("/sales-chart", response_model=SalesChart)
async def sales_chart(
    db: DbSession, period: str = Query(default="7d", pattern="^(7d|30d|90d)$")
) -> SalesChart:
    days = {"7d": 7, "30d": 30, "90d": 90}[period]
    return SalesChart(**await dashboard_service.get_sales_chart(db, days))


@router.get("/low-stock", response_model=list[LowStockItem])
async def low_stock(db: DbSession) -> list[LowStockItem]:
    return [LowStockItem(**r) for r in await dashboard_service.get_low_stock(db)]


@router.get("/recent-orders", response_model=list[RecentOrder])
async def recent_orders(db: DbSession) -> list[RecentOrder]:
    return [RecentOrder(**r) for r in await dashboard_service.get_recent_orders(db)]
