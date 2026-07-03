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
