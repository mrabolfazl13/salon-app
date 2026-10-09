"""add fcm_token to users

Revision ID: 2026_10_10_add_fcm_token
Revises: previous_revision
Create Date: 2026-10-10 01:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2026_10_10_add_fcm_token'
down_revision = None  # TODO: Update with actual previous revision
branch_labels = None
depends_on = None


def upgrade():
    # Add fcm_token column to users table
    op.add_column('users', sa.Column('fcm_token', sa.String(length=500), nullable=True))
    # Create index for faster lookups
    op.create_index(op.f('ix_users_fcm_token'), 'users', ['fcm_token'], unique=False)


def downgrade():
    # Remove index and column
    op.drop_index(op.f('ix_users_fcm_token'), table_name='users')
    op.drop_column('users', 'fcm_token')
