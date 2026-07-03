"""SQLAlchemy models package.

Every model is imported here so Alembic autogenerate can detect all tables via
Base.metadata.
"""
from app.models.cart import CartItem, WishlistItem
from app.models.coupon import Coupon
from app.models.order import Order, OrderItem, OrderStatusHistory, PaymentEvent
from app.models.product import Category, Product, ProductImage, ProductVariant
from app.models.review import Review
from app.models.service_token import ServiceToken
from app.models.user import Address, RefreshToken, User

__all__ = [
    "User",
    "RefreshToken",
    "Address",
    "Category",
    "Product",
    "ProductVariant",
    "ProductImage",
    "CartItem",
    "WishlistItem",
    "Order",
    "OrderItem",
    "OrderStatusHistory",
    "PaymentEvent",
    "Coupon",
    "Review",
    "ServiceToken",
]
