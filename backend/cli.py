"""
Command Line Interface for Qwipi AI Administration.
Usage:
    python -m backend.cli list-users
    python -m backend.cli promote-admin <email>
    python -m backend.cli demote-admin <email>
"""
import sys
import asyncio
from sqlalchemy.future import select
from backend.database import AsyncSessionLocal
from backend.models import User


async def list_users():
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(User).order_by(User.created_at.desc()))
            users = result.scalars().all()
            print(f"\nTotal users registered: {len(users)}")
            print("-" * 75)
            print(f"{'ID':<38} | {'Email':<25} | {'Admin':<6}")
            print("-" * 75)
            for u in users:
                print(f"{str(u.id):<38} | {u.email:<25} | {str(u.is_admin):<6}")
            print("-" * 75)
    except Exception as e:
        print(f"\nDatabase Connection Error: {e}")
        print("Please ensure PostgreSQL is running (e.g. run 'docker compose up -d db' or start PostgreSQL service).\n")


async def set_admin_status(email: str, is_admin: bool):
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(User).where(User.email == email.strip()))
            user = result.scalars().first()
            if not user:
                print(f"Error: User with email '{email}' not found.")
                return False
            
            user.is_admin = is_admin
            await session.commit()
            status_str = "promoted to Admin" if is_admin else "demoted from Admin"
            print(f"Success: User '{email}' successfully {status_str}.")
            return True
    except Exception as e:
        print(f"\nDatabase Connection Error: {e}")
        print("Please ensure PostgreSQL is running (e.g. run 'docker compose up -d db' or start PostgreSQL service).\n")
        return False


async def set_user_password(email: str, new_password: str):
    from backend.auth import get_password_hash
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(User).where(User.email == email.strip()))
            user = result.scalars().first()
            if not user:
                print(f"Error: User with email '{email}' not found.")
                return False
            
            user.hashed_password = get_password_hash(new_password)
            await session.commit()
            print(f"Success: Password for '{email}' has been reset successfully.")
            return True
    except Exception as e:
        print(f"\nDatabase Connection Error: {e}")
        return False


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "list-users":
        asyncio.run(list_users())
    elif command == "promote-admin":
        if len(sys.argv) < 3:
            print("Error: Missing email argument. Usage: python -m backend.cli promote-admin <email>")
            sys.exit(1)
        asyncio.run(set_admin_status(sys.argv[2], True))
    elif command == "demote-admin":
        if len(sys.argv) < 3:
            print("Error: Missing email argument. Usage: python -m backend.cli demote-admin <email>")
            sys.exit(1)
        asyncio.run(set_admin_status(sys.argv[2], False))
    elif command == "set-password":
        if len(sys.argv) < 4:
            print("Error: Usage: python -m backend.cli set-password <email> <new_password>")
            sys.exit(1)
        asyncio.run(set_user_password(sys.argv[2], sys.argv[3]))
    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
