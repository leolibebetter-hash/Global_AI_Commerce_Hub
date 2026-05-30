"""add amazon_accounts and publish_records tables

Revision ID: b2c9e5f1a3d4
Revises: 0f7cc4c8eed8
Create Date: 2026-05-30 20:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "b2c9e5f1a3d4"
down_revision: Union[str, None] = "0f7cc4c8eed8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "amazon_accounts",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("seller_id", sa.String(50), nullable=False),
        sa.Column("access_token", sa.Text(), nullable=False),
        sa.Column("refresh_token", sa.Text(), nullable=False),
        sa.Column("marketplace_id", sa.String(20), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_amazon_accounts_user_id"), "amazon_accounts", ["user_id"], unique=False)
    op.create_table(
        "publish_records",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("asin", sa.String(20), nullable=True),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("title", sa.String(300), nullable=True),
        sa.Column("sku", sa.String(100), nullable=True),
        sa.Column("price", sa.Float(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("seller_central_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_publish_records_user_id"), "publish_records", ["user_id"], unique=False)
    op.create_index(op.f("ix_publish_records_created_at"), "publish_records", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_publish_records_created_at"), table_name="publish_records")
    op.drop_index(op.f("ix_publish_records_user_id"), table_name="publish_records")
    op.drop_table("publish_records")
    op.drop_index(op.f("ix_amazon_accounts_user_id"), table_name="amazon_accounts")
    op.drop_table("amazon_accounts")
