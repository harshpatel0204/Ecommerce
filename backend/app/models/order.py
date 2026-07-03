"""Order models: Order, OrderItem, OrderStatusHistory, PaymentEvent.

Orders are immutable snapshots: line items store product name/price/sku/size/color
directly, plus an image_id reference (images are soft-deleted, so it always
resolves). The shipping address is a JSONB snapshot, not a FK.
"""
import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDMixin


class Order(UUIDMixin, Base):
    __tablename__ = "orders"

    order_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    # Snapshot (JSONB) — not a FK — so historical delivery address stays accurate.
    shipping_address: Mapped[dict] = mapped_column(JSONB, nullable=False)

    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    shipping_fee: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0")
    discount_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0")
    coupon_code: Mapped[str | None] = mapped_column(String(30))
    tax_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0")
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    # pending → paid → processing → packed → shipped → out_for_delivery → delivered
    # → cancelled | return_requested → returned → refunded
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, server_default="pending", index=True
    )
    # unpaid → paid → failed → refunded
    payment_status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="unpaid")
    payment_method: Mapped[str | None] = mapped_column(String(20))

    # Razorpay refs (public IDs only — never store secrets/signature long-term secrets)
    razorpay_order_id: Mapped[str | None] = mapped_column(String(100))
    razorpay_payment_id: Mapped[str | None] = mapped_column(String(100))
    razorpay_signature: Mapped[str | None] = mapped_column(String(255))

    # Shiprocket refs
    shiprocket_order_id: Mapped[str | None] = mapped_column(String(50))
    shiprocket_shipment_id: Mapped[str | None] = mapped_column(String(50))
    awb_number: Mapped[str | None] = mapped_column(String(50))
    courier_name: Mapped[str | None] = mapped_column(String(100))
    tracking_url: Mapped[str | None] = mapped_column(String(500))
    estimated_delivery: Mapped[date | None] = mapped_column(Date)

    placed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    shipped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
    status_history: Mapped[list["OrderStatusHistory"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Order {self.order_number} status={self.status}>"


class OrderItem(UUIDMixin, Base):
    __tablename__ = "order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), index=True
    )
    variant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_variants.id")
    )
    # Snapshotted at purchase time — never changes retroactively.
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_sku: Mapped[str] = mapped_column(String(50), nullable=False)
    variant_sku: Mapped[str] = mapped_column(String(50), nullable=False)
    size: Mapped[str | None] = mapped_column(String(20))
    color: Mapped[str | None] = mapped_column(String(30))
    # Thumbnail reference; product images are soft-deleted so this always resolves.
    image_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_images.id")
    )
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    line_total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    order: Mapped["Order"] = relationship(back_populates="items")

    def __repr__(self) -> str:
        return f"<OrderItem {self.product_name} x{self.quantity}>"


class OrderStatusHistory(UUIDMixin, Base):
    __tablename__ = "order_status_history"

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    changed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )  # null = system/webhook
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    order: Mapped["Order"] = relationship(back_populates="status_history")

    def __repr__(self) -> str:
        return f"<OrderStatusHistory {self.status}>"


class PaymentEvent(UUIDMixin, Base):
    __tablename__ = "payment_events"

    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id")
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    razorpay_payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    # For webhook idempotency — the Razorpay payment id, if present in the payload.
    razorpay_payment_id: Mapped[str | None] = mapped_column(String(100), unique=True)
    processed: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (Index("idx_payment_events_order", "order_id"),)

    def __repr__(self) -> str:
        return f"<PaymentEvent {self.event_type}>"
