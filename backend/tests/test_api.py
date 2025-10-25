from datetime import datetime, timezone
from decimal import Decimal

from fastapi.testclient import TestClient


def create_strategy(client: TestClient) -> str:
    response = client.post(
        "/api/strategies",
        json={
            "name": "ICT Breaker",
            "category": "Entry",
            "timeframes": ["15M", "1H"],
            "preferred_direction": "Both",
            "entry_criteria": "Breaker block + FVG",
        },
    )
    response.raise_for_status()
    return response.json()["id"]


def create_account(client: TestClient) -> str:
    response = client.post(
        "/api/accounts",
        json={
            "name": "Funded 100k",
            "type": "Funded",
            "broker_platform": "NinjaTrader",
            "initial_balance": 100000,
            "commission_split_percent": 80,
        },
    )
    response.raise_for_status()
    return response.json()["id"]


def test_create_strategy_and_account(client: TestClient) -> None:
    strategy_id = create_strategy(client)
    account_id = create_account(client)

    strategy_response = client.get(f"/api/strategies/{strategy_id}")
    account_response = client.get(f"/api/accounts/{account_id}")

    assert strategy_response.status_code == 200
    assert account_response.status_code == 200
    assert strategy_response.json()["name"] == "ICT Breaker"
    assert Decimal(account_response.json()["current_balance"]) == Decimal("100000")


def test_create_trade_with_calculations(client: TestClient) -> None:
    strategy_id = create_strategy(client)
    account_id = create_account(client)

    payload = {
        "symbol": "NQ1!",
        "direction": "Long",
        "quantity": 2,
        "session": "NY",
        "strategy_id": strategy_id,
        "account_id": account_id,
        "entryDateTime": datetime(2024, 5, 1, 13, 30, tzinfo=timezone.utc).isoformat(),
        "exitDateTime": datetime(2024, 5, 1, 14, 0, tzinfo=timezone.utc).isoformat(),
        "entry_price": 15234.5,
        "stopLossPlanned": 15220.5,
        "takeProfitPlanned": 15270.5,
        "exit_price": 15264.5,
        "commissions": 4.5,
        "confirmations": ["BOS Confirmed", "Fair Value Gap Filled"],
        "notes": "Textbook setup",
        "tag_names": ["ICT-FVG", "Breaker"],
    }

    response = client.post("/api/trades", json=payload)
    assert response.status_code == 201, response.text

    data = response.json()
    assert data["confirmations_count"] == 2
    assert data["strategy"]["id"] == strategy_id
    assert data["account"]["id"] == account_id

    expected_pnl = (Decimal("15264.5") - Decimal("15234.5")) * Decimal("2") - Decimal("4.5")
    assert Decimal(str(data["pnl"])) == expected_pnl

    expected_risk = (Decimal("15234.5") - Decimal("15220.5")) * Decimal("2")
    assert Decimal(str(data["risk_per_trade"])) == expected_risk

    assert data["r_multiple"] is not None

    # Ensure account balance updated
    account = client.get(f"/api/accounts/{account_id}").json()
    assert Decimal(str(account["current_balance"])) == Decimal("100000") + expected_pnl


def test_trade_validation_exit_before_entry(client: TestClient) -> None:
    strategy_id = create_strategy(client)
    account_id = create_account(client)

    payload = {
        "symbol": "ES",
        "direction": "Short",
        "quantity": 1,
        "strategy_id": strategy_id,
        "account_id": account_id,
        "entryDateTime": datetime(2024, 5, 1, 14, 0, tzinfo=timezone.utc).isoformat(),
        "exitDateTime": datetime(2024, 5, 1, 13, 30, tzinfo=timezone.utc).isoformat(),
        "entry_price": 5100,
        "exit_price": 5090,
        "commissions": 2,
        "confirmations": [],
        "tag_names": [],
    }

    response = client.post("/api/trades", json=payload)
    assert response.status_code == 422
