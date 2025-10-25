import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app


TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql:///trading_journal_test")

engine = create_engine(TEST_DATABASE_URL, future=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database() -> None:
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def clean_database() -> None:
    with engine.begin() as connection:
        connection.execute(text("TRUNCATE TABLE trade_tags RESTART IDENTITY CASCADE"))
        connection.execute(text("TRUNCATE TABLE trades RESTART IDENTITY CASCADE"))
        connection.execute(text("TRUNCATE TABLE strategies RESTART IDENTITY CASCADE"))
        connection.execute(text("TRUNCATE TABLE accounts RESTART IDENTITY CASCADE"))
        connection.execute(text("TRUNCATE TABLE tags RESTART IDENTITY CASCADE"))
    yield


@pytest.fixture()
def client() -> TestClient:
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.rollback()
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.pop(get_db, None)
