"""List users and ensure an admin user exists for testing."""
import asyncio
from app.core.database import AsyncSessionLocal, engine
from app.models.user import User
from sqlalchemy import select
from app.core.security import hash_password


async def go():
    async with AsyncSessionLocal() as db:
        r = await db.execute(select(User).limit(10))
        users = r.scalars().all()
        print(f"\n--- Found {len(users)} users ---")
        for u in users:
            print(f"  {u.email} | admin={u.is_admin} | active={u.is_active}")

        # Check if an admin exists
        r2 = await db.execute(select(User).where(User.is_admin == True))
        admin = r2.scalar_one_or_none()
        if admin:
            print(f"\nAdmin user exists: {admin.email}")
        else:
            print("\nNo admin found. Creating admin@hariomcoins.in ...")
            admin = User(
                email="admin@hariomcoins.in",
                password_hash=hash_password("Admin@123"),
                full_name="Admin",
                is_admin=True,
                is_active=True,
            )
            db.add(admin)
            await db.commit()
            print("Admin user created: admin@hariomcoins.in / Admin@123")

    await engine.dispose()


asyncio.run(go())
