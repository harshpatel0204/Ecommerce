"""Admin dashboard + user-management schemas."""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class DashboardStats(BaseModel):
    revenue_today: float
    revenue_this_month: float
    revenue_total: float
    orders_today: int
    orders_this_month: int
    orders_pending: int
    orders_shipped: int
    products_total: int
    low_stock_products: int
    customers_total: int
    customers_new_this_month: int


class SalesChart(BaseModel):
    labels: list[str]
    revenue: list[float]
    orders: list[int]


class LowStockItem(BaseModel):
    product_name: str
    variant_sku: str
    size: str | None
    color: str | None
    stock_quantity: int
    low_stock_threshold: int


class RecentOrder(BaseModel):
    order_number: str
    customer_name: str | None
    total_amount: float
    status: str
    placed_at: datetime


class AdminUserItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    full_name: str | None
    phone: str | None
    is_admin: bool
    is_active: bool
    created_at: datetime


class AdminUserListResponse(BaseModel):
    items: list[AdminUserItem]
    total: int
    page: int
    pages: int
    limit: int
