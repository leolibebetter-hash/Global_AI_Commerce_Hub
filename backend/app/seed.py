"""Seed development data: test user with free credits."""
import uuid
from app.core.database import SessionLocal
from app.models.user import User
from app.models.user_ai_balance import UserAIBalance


def seed():
    db = SessionLocal()
    try:
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            phone="13800138000",
            password_hash="not-a-real-hash",
            role="user",
        )
        db.add(user)

        balance = UserAIBalance(
            user_id=user_id,
            image_credits=10,
            text_credits=5,
        )
        db.add(balance)
        db.commit()
        print(f"Seeded test user: {user_id}")
        return user_id
    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
