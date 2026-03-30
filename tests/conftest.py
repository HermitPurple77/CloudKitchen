# conftest.py  –  root-level pytest fixtures for CloudKitchen
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

# ── In-memory SQLite for unit/integration tests ───────────────────────────────
TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def create_test_tables():
    """Create all tables once per test session, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    """Fresh DB session per test, always rolled back."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    """FastAPI TestClient with DB dependency overridden."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── Sample data fixtures ───────────────────────────────────────────────────────
@pytest.fixture()
def sample_menu_item():
    return {
        "name": "Butter Chicken",
        "description": "Classic creamy curry",
        "price": 299.0,
        "category": "main_course",
        "is_available": True,
    }


@pytest.fixture()
def sample_order():
    return {
        "customer_name": "Test User",
        "customer_email": "test@example.com",
        "items": [{"menu_item_id": 1, "quantity": 2}],
        "delivery_address": "123 Test Street, Bengaluru",
    }
