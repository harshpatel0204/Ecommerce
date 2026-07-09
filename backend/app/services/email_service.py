"""Transactional email via Resend.

If RESEND_API_KEY is unset (local dev / tests), emails are logged instead of
sent, so flows that trigger email don't fail. More templates (order confirmation,
shipping updates) are added in later phases.
"""
import logging

import resend

from app.core.config import settings

logger = logging.getLogger("bharatshop.email")


def _send(to: str, subject: str, html: str) -> None:
    if not settings.RESEND_API_KEY:
        logger.info("[email suppressed — no RESEND_API_KEY] to=%s subject=%s", to, subject)
        return
    resend.api_key = settings.RESEND_API_KEY
    resend.Emails.send(
        {
            "from": settings.EMAIL_FROM,
            "to": [to],
            "subject": subject,
            "html": html,
        }
    )


def send_order_confirmation(to_email: str, order_number: str, total_amount: float) -> None:
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>Thanks for your order!</h2>
      <p>Your order <strong>{order_number}</strong> has been confirmed.</p>
      <p>Total paid: <strong>₹{total_amount:.2f}</strong></p>
      <p>We'll email you again when it ships.</p>
    </div>
    """
    _send(to_email, f"Order confirmed — {order_number}", html)


def send_order_shipped(to_email: str, order_number: str, awb: str | None, tracking_url: str | None) -> None:
    track = (
        f'<p><a href="{tracking_url}">Track your shipment</a></p>' if tracking_url else ""
    )
    awb_line = f"<p>AWB: <strong>{awb}</strong></p>" if awb else ""
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>Your order is on its way! 🚚</h2>
      <p>Order <strong>{order_number}</strong> has shipped.</p>
      {awb_line}
      {track}
    </div>
    """
    _send(to_email, f"Your order {order_number} has shipped", html)


def send_order_delivered(to_email: str, order_number: str) -> None:
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>Delivered! 🎉</h2>
      <p>Order <strong>{order_number}</strong> has been delivered. We hope you love it!</p>
    </div>
    """
    _send(to_email, f"Order {order_number} delivered", html)


def send_abandoned_cart(to_email: str, name: str | None, item_count: int, cart_link: str) -> None:
    greeting = f"Hi {name}," if name else "Hi,"
    items = "item" if item_count == 1 else "items"
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>You left something behind 🛒</h2>
      <p>{greeting}</p>
      <p>You still have <strong>{item_count} {items}</strong> waiting in your {settings.APP_NAME} cart.
      Popular collectibles sell out fast — complete your order before they're gone.</p>
      <p><a href="{cart_link}" style="background:#2563eb;color:#fff;padding:10px 18px;
        border-radius:6px;text-decoration:none;display:inline-block;">Return to my cart</a></p>
    </div>
    """
    _send(to_email, f"Your {settings.APP_NAME} cart is waiting", html)


def send_password_reset(to_email: str, reset_link: str) -> None:
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>Reset your {settings.APP_NAME} password</h2>
      <p>We received a request to reset your password. This link expires in 1 hour.</p>
      <p><a href="{reset_link}" style="background:#2563eb;color:#fff;padding:10px 18px;
        border-radius:6px;text-decoration:none;display:inline-block;">Reset password</a></p>
      <p style="color:#666;font-size:13px;">If you didn't request this, you can ignore this email.</p>
    </div>
    """
    _send(to_email, f"Reset your {settings.APP_NAME} password", html)
