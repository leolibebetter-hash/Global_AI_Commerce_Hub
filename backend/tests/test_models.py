from app.models.user import User
from app.models.user_ai_balance import UserAIBalance
from app.models.user_ai_usage import UserAIUsage
from app.models.recharge_order import RechargeOrder
from app.models.user_session import UserSession


def test_create_user(db_session):
    user = User(phone="13900001111", role="user")
    db_session.add(user)
    db_session.commit()

    saved = db_session.query(User).filter_by(phone="13900001111").first()
    assert saved is not None
    assert saved.role == "user"
    assert saved.id is not None
    assert saved.is_active is True
    assert saved.created_at is not None


def test_user_balance_relationship(db_session):
    from app.core.database import engine
    from app.models import UserAIBalance

    user = User(phone="13900002222", role="user")
    db_session.add(user)
    db_session.flush()

    balance = UserAIBalance(user_id=user.id, image_credits=10, text_credits=5)
    db_session.add(balance)
    db_session.commit()

    assert balance.user_id == user.id


def test_usage_record(db_session):
    user = User(phone="13900003333", role="user")
    db_session.add(user)
    db_session.flush()

    usage = UserAIUsage(
        user_id=user.id,
        action_type="text_gen",
        credits_used=1.0,
        api_cost=0.004,
    )
    db_session.add(usage)
    db_session.commit()

    assert usage.id is not None
    assert usage.action_type == "text_gen"


def test_recharge_order(db_session):
    user = User(phone="13900004444", role="user")
    db_session.add(user)
    db_session.flush()

    order = RechargeOrder(
        user_id=user.id,
        order_no="R20260530001",
        amount=150.00,
        package_type="basic",
        image_credits=100,
        text_credits=50,
    )
    db_session.add(order)
    db_session.commit()

    assert order.status == "pending"
    assert order.paid_at is None


def test_all_models_importable():
    from app.models import User, UserSession, UserAIBalance, UserAIUsage, RechargeOrder
    assert User.__tablename__ == "users"
    assert UserSession.__tablename__ == "user_sessions"
    assert UserAIBalance.__tablename__ == "user_ai_balance"
    assert UserAIUsage.__tablename__ == "user_ai_usage"
    assert RechargeOrder.__tablename__ == "recharge_orders"
