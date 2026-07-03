"""Idempotently create the single admin account from env vars.

Usage:
    python seed_admin.py

Reads ADMIN_EMAIL and ADMIN_PASSWORD from settings (.env). Safe to run multiple
times — if a user with that email already exists it is promoted to admin (if not
already) and the script exits without creating a duplicate.
"""
import asyncio

from sqlalchemy import select

from app.core.config import settings
from app.core.database import AsyncSessionLocal, engine
from app.core.security import hash_password
from app.models.user import User


async def seed_admin() -> None:
    async with AsyncSessionLocal() as db:
        existing = await db.scalar(select(User).where(User.email == settings.ADMIN_EMAIL))
        if existing is not None:
            if not existing.is_admin:
                existing.is_admin = True
                await db.commit()
                print(f"Promoted existing user to admin: {settings.ADMIN_EMAIL}")
            else:
                print(f"Admin already exists, nothing to do: {settings.ADMIN_EMAIL}")
            return

        admin = User(
            email=settings.ADMIN_EMAIL,
            hashed_password=hash_password(settings.ADMIN_PASSWORD),
            full_name="Store Admin",
            is_admin=True,
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        print(f"Created admin account: {settings.ADMIN_EMAIL}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_admin())
