"""add banners

Revision ID: b7e2a1c4d9f0
Revises: 54332767c1c3
Create Date: 2026-07-14 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7e2a1c4d9f0'
down_revision: Union[str, None] = '54332767c1c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'banners',
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('subtitle', sa.String(length=300), nullable=True),
        sa.Column('cta_text', sa.String(length=50), nullable=True),
        sa.Column('product_id', sa.UUID(), nullable=True),
        sa.Column('sort_order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('banners')
