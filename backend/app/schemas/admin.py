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


class NewsletterSubscriberItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    created_at: datetime


class NewsletterListResponse(BaseModel):
    items: list[NewsletterSubscriberItem]
    total: int
    page: int
    pages: int
    limit: int


# ------------------------------------------------------------- Customer detail
class CustomerOrderSummary(BaseModel):
    order_number: str
    status: str
    total_amount: float
    placed_at: datetime


class CustomerDetail(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str | None
    phone: str | None
    is_admin: bool
    is_active: bool
    created_at: datetime
    orders_count: int
    total_spent: float
    last_order_at: datetime | None
    orders: list[CustomerOrderSummary]


# ------------------------------------------------------------------- Analytics
class TopProduct(BaseModel):
    product_name: str
    units_sold: int
    revenue: float


class CategorySales(BaseModel):
    category: str
    revenue: float
    units: int


class AnalyticsSummary(BaseModel):
    revenue: float
    orders: int
    avg_order_value: float
    unique_customers: int


# ------------------------------------------------------------ Abandoned carts
class AbandonedCart(BaseModel):
    user_id: uuid.UUID
    full_name: str | None
    email: EmailStr
    item_count: int
    total_value: float
    oldest_added_at: datetime
    reminder_sent: bool
