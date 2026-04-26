import os  # Add this at the top
from logging.config import fileConfig
# ... existing imports

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
from app.models.models import Base
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = os.environ.get("DATABASE_URL")
    
    # Critical Fix: SQLAlchemy 2.0 requires 'postgresql://' not 'postgres://'
    if url and url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # Get the database URL from Render's environment variables
    db_url = os.environ.get("DATABASE_URL")
    
    # If the URL starts with 'postgres://', change it to 'postgresql://' 
    # (Render sometimes provides 'postgres://' which SQLAlchemy 2.0 doesn't like)
    if db_url and db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    # Use the dynamic URL instead of the one from alembic.ini
    from sqlalchemy import create_engine
    connectable = create_engine(db_url, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with connectable.begin(): # Using begin() handles the transaction automatically
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
