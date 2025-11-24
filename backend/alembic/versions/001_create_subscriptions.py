"""
Database Migration: Create Subscriptions Table
Generated: 2024-11-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers
revision = '001_create_subscriptions'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tier', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('stripe_subscription_id', sa.String(255), nullable=True, unique=True),
        sa.Column('stripe_customer_id', sa.String(255), nullable=True),
        sa.Column('current_period_start', sa.TIMESTAMP, nullable=True),
        sa.Column('current_period_end', sa.TIMESTAMP, nullable=True),
        sa.Column('cancel_at_period_end', sa.Boolean, default=False),
        sa.Column('created_at', sa.TIMESTAMP, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.TIMESTAMP, server_default=sa.text('NOW()'))
    )
    
    # Create indexes
    op.create_index('idx_subscriptions_user', 'subscriptions', ['user_id'])
    op.create_index('idx_subscriptions_stripe_id', 'subscriptions', ['stripe_subscription_id'])
    op.create_index('idx_subscriptions_status', 'subscriptions', ['status'])
    
    # Add tier column to users table if not exists
    op.add_column('users', sa.Column('tier', sa.String(20), server_default='free'))

def downgrade():
    op.drop_index('idx_subscriptions_status', 'subscriptions')
    op.drop_index('idx_subscriptions_stripe_id', 'subscriptions')
    op.drop_index('idx_subscriptions_user', 'subscriptions')
    op.drop_table('subscriptions')
    op.drop_column('users', 'tier')
