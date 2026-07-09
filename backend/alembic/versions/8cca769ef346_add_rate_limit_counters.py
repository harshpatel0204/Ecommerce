"""add rate_limit_counters + cart_items.reminder_sent_at

Revision ID: 8cca769ef346
Revises: 836711b05b45
Create Date: 2026-07-09 12:00:32.923080
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8cca769ef346'
down_revision: Union[str, None] = '836711b05b45'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # NOTE: autogenerate also proposed dropping Neon's sample table
    # "playing_with_neon"; intentionally left untouched (not ours).
    op.create_table('rate_limit_counters',
    sa.Column('key', sa.String(length=255), nullable=False),
    sa.Column('window_start', sa.DateTime(timezone=True), nullable=False),
    sa.Column('count', sa.Integer(), nullable=False),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('key')
    )
    op.add_column(
        'cart_items',
        sa.Column('reminder_sent_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('cart_items', 'reminder_sent_at')
    op.drop_table('rate_limit_counters')
