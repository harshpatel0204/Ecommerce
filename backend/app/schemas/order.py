"""Order + checkout + payment schemas."""
import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class CheckoutRequest(BaseModel):
    address_id: uuid.UUID
    coupon_code: str | None = None  # accepted now; applied in Phase 8


class CheckoutResponse(BaseModel):
    order_id: uuid.UUID
    order_number: str
    razorpay_order_id: str | None
    razorpay_key_id: str
    amount_paise: int
    total_amount: float
    currency: str = "INR"


class VerifyPaymentRequest(BaseModel):
    order_id: uuid.UUID
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_name: str
    product_sku: str
    variant_sku: str
    size: str | None
    color: str | None
    image_id: uuid.UUID | None
    unit_price: float
    quantity: int
    line_total: float


class StatusHistoryEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str
    note: str | None
    changed_at: datetime


class OrderListItem(BaseModel):
    id: uuid.UUID
    order_number: str
    status: str
    payment_status: str
    total_amount: float
    placed_at: datetime
    item_count: int
    first_image_id: uuid.UUID | None = None


class OrderListResponse(BaseModel):
    items: list[OrderListItem]
    total: int
    page: int
    pages: int
    limit: int


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_number: str
    status: str
    payment_status: str
    payment_method: str | None
    subtotal: float
    shipping_fee: float
    discount_amount: float
    tax_amount: float
    total_amount: float
    shipping_address: dict
    razorpay_order_id: str | None
    awb_number: str | None
    courier_name: str | None
    tracking_url: str | None
    estimated_delivery: date | None
    placed_at: datetime
    paid_at: datetime | None
    shipped_at: datetime | None
    delivered_at: datetime | None
    items: list[OrderItemResponse] = []
    status_history: list[StatusHistoryEntry] = []


class VerifyPaymentResponse(BaseModel):
    success: bool
    order_number: str


class OrderStatusUpdate(BaseModel):
    status: str
    note: str | None = None


class LabelResponse(BaseModel):
    label_url: str | None


class TrackingScan(BaseModel):
    date: str | None = None
    activity: str | None = None
    location: str | None = None


class TrackingResponse(BaseModel):
    current_status: str | None = None
    scans: list[TrackingScan] = []
