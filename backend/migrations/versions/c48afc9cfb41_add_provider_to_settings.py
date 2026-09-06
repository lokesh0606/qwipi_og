"""add_provider_to_settings

Revision ID: c48afc9cfb41
Revises: b1fa24cb073f
Create Date: 2026-05-28 15:01:36.023599

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c48afc9cfb41'
down_revision: Union[str, Sequence[str], None] = 'b1fa24cb073f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('settings', sa.Column('provider', sa.String(), server_default='groq', nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('settings', 'provider')
