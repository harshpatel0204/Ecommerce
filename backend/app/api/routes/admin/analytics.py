"""Admin analytics + reports. All require get_current_admin."""
from fastapi import APIRouter, Depends, Query

from app.core.deps import DbSession, get_current_admin
from app.schemas.admin import AnalyticsSummary, CategorySales, TopProduct
from app.services import analytics_service

router = APIRouter(
    prefix="/admin/analytics", tags=["admin:analytics"], dependencies=[Depends(get_current_admin)]
)

_DaysQuery = Query(default=30, ge=1, le=365)


@router.get("/summary", response_model=AnalyticsSummary)
async def summary(db: DbSession, days: int = _DaysQuery) -> AnalyticsSummary:
    return AnalyticsSummary(**await analytics_service.summary(db, days))


@router.get("/top-products", response_model=list[TopProduct])
async def top_products(
    db: DbSession, days: int = _DaysQuery, limit: int = Query(default=10, ge=1, le=50)
) -> list[TopProduct]:
    return [TopProduct(**r) for r in await analytics_service.top_products(db, days, limit)]


@router.get("/sales-by-category", response_model=list[CategorySales])
async def sales_by_category(db: DbSession, days: int = _DaysQuery) -> list[CategorySales]:
    return [CategorySales(**r) for r in await analytics_service.sales_by_category(db, days)]
