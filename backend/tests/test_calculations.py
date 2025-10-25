from decimal import Decimal

from app.models import TradeDirection
from app.services import calculations


def test_calculate_pnl_long() -> None:
    pnl = calculations.calculate_pnl(
        direction=TradeDirection.LONG,
        entry_price=Decimal("100"),
        exit_price=Decimal("110"),
        quantity=Decimal("2"),
        commissions=Decimal("5"),
    )
    assert pnl == Decimal("15")


def test_calculate_pnl_short() -> None:
    pnl = calculations.calculate_pnl(
        direction=TradeDirection.SHORT,
        entry_price=Decimal("110"),
        exit_price=Decimal("100"),
        quantity=Decimal("2"),
        commissions=Decimal("5"),
    )
    assert pnl == Decimal("15")


def test_calculate_trade_metrics_with_risk() -> None:
    pnl, risk, rr, r_multiple = calculations.calculate_trade_metrics(
        direction=TradeDirection.LONG,
        entry_price=Decimal("100"),
        exit_price=Decimal("110"),
        quantity=Decimal("1"),
        commissions=Decimal("0"),
        stop_loss=Decimal("95"),
        take_profit=Decimal("115"),
    )

    assert pnl == Decimal("10")
    assert risk == Decimal("5")
    assert rr == Decimal("3")  # reward 15 / risk 5
    assert r_multiple == Decimal("2")


def test_calculate_trade_metrics_without_stop_loss() -> None:
    pnl, risk, rr, r_multiple = calculations.calculate_trade_metrics(
        direction=TradeDirection.LONG,
        entry_price=Decimal("100"),
        exit_price=Decimal("95"),
        quantity=Decimal("1"),
        commissions=Decimal("0"),
        stop_loss=None,
        take_profit=None,
    )

    assert pnl == Decimal("-5")
    assert risk is None
    assert rr is None
    assert r_multiple is None
