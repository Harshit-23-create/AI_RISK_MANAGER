"""
simulation/payment_generator.py

Standalone payment event generator.
This module can be used independently from the FastAPI backend for
scripting, testing, or batch data generation.

Usage:
    from simulation.payment_generator import PaymentGenerator
    gen = PaymentGenerator()
    event = gen.normal_payment("USER_0001")
"""
import random
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional


PAYMENT_METHODS = ["UPI", "card", "netbanking", "wallet", "NEFT", "RTGS", "IMPS"]
CITIES = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Pune", "Kolkata"]
KNOWN_IP_RANGES = ["103", "49", "117", "157"]


@dataclass
class PaymentEvent:
    """Standalone payment event — mirrors TransactionCreate fields."""
    transaction_id: str
    user_id: str
    merchant_id: Optional[int]
    amount: float
    currency: str
    ip_address: Optional[str]
    device_id: Optional[str]
    user_agent: Optional[str]
    country: str
    city: str
    api_endpoint: str
    http_method: str
    response_status: int
    payment_method: str
    failed_attempts: int
    transaction_frequency: float
    account_age_days: int
    previous_transaction_avg: float
    previous_transaction_count: int
    is_new_device: bool
    is_new_ip: bool
    scenario_label: str
    timestamp: datetime


class PaymentGenerator:
    """
    Generates synthetic payment events with realistic attributes.
    This is the standalone module described in the project spec.
    The FastAPI simulation service wraps this via SimulationService.
    """

    def __init__(self, seed: Optional[int] = None):
        self._rng = random.Random(seed)
        self._known_ips = [
            f"{self._rng.choice(KNOWN_IP_RANGES)}.{self._rng.randint(1,254)}.{self._rng.randint(1,254)}.{self._rng.randint(1,254)}"
            for _ in range(100)
        ]
        self._known_devices = [f"DEV_{uuid.uuid4().hex[:8].upper()}" for _ in range(50)]

    def _txn_id(self) -> str:
        return str(uuid.uuid4())

    def _known_ip(self) -> str:
        return self._rng.choice(self._known_ips)

    def _known_device(self) -> str:
        return self._rng.choice(self._known_devices[:30])

    def _new_device(self) -> str:
        return f"DEV_{uuid.uuid4().hex[:8].upper()}_NEW"

    def _suspicious_ip(self) -> str:
        return f"185.{self._rng.randint(100,200)}.{self._rng.randint(1,254)}.{self._rng.randint(1,254)}"

    def normal_payment(self, user_id: str, avg_amount: float = 1500.0) -> PaymentEvent:
        """Generate a normal, low-risk payment event."""
        amount = round(avg_amount * self._rng.uniform(0.5, 1.5), 2)
        return PaymentEvent(
            transaction_id=self._txn_id(),
            user_id=user_id,
            merchant_id=self._rng.randint(1, 5),
            amount=amount,
            currency="INR",
            ip_address=self._known_ip(),
            device_id=self._known_device(),
            user_agent="Mozilla/5.0 (Android 12; Mobile) Chrome/120",
            country="India",
            city=self._rng.choice(CITIES),
            api_endpoint="/api/v1/payments/create",
            http_method="POST",
            response_status=200,
            payment_method=self._rng.choice(PAYMENT_METHODS),
            failed_attempts=self._rng.choices([0, 1], weights=[0.93, 0.07])[0],
            transaction_frequency=round(self._rng.uniform(0.1, 2.0), 2),
            account_age_days=self._rng.randint(90, 1500),
            previous_transaction_avg=avg_amount,
            previous_transaction_count=self._rng.randint(5, 200),
            is_new_device=False,
            is_new_ip=False,
            scenario_label="normal",
            timestamp=datetime.now(timezone.utc),
        )

    def unusual_amount(self, user_id: str, avg_amount: float = 1500.0) -> PaymentEvent:
        """Scenario A: Amount 5–20× the user's historical average."""
        multiplier = self._rng.uniform(5, 20)
        amount = round(avg_amount * multiplier, 2)
        return PaymentEvent(
            transaction_id=self._txn_id(),
            user_id=user_id,
            merchant_id=self._rng.randint(1, 5),
            amount=amount,
            currency="INR",
            ip_address=self._known_ip(),
            device_id=self._known_device(),
            user_agent="Mozilla/5.0",
            country="India",
            city=self._rng.choice(CITIES),
            api_endpoint="/api/v1/payments/create",
            http_method="POST",
            response_status=200,
            payment_method="card",
            failed_attempts=self._rng.randint(0, 2),
            transaction_frequency=round(self._rng.uniform(0.5, 3.0), 2),
            account_age_days=self._rng.randint(90, 1500),
            previous_transaction_avg=avg_amount,
            previous_transaction_count=self._rng.randint(5, 200),
            is_new_device=False,
            is_new_ip=False,
            scenario_label="unusual_amount",
            timestamp=datetime.now(timezone.utc),
        )

    def multiple_failed_attempts(self, user_id: str, avg_amount: float = 1500.0) -> PaymentEvent:
        """Scenario B: Many failed authentication attempts."""
        failed = self._rng.randint(6, 15)
        return PaymentEvent(
            transaction_id=self._txn_id(),
            user_id=user_id,
            merchant_id=self._rng.randint(1, 5),
            amount=round(avg_amount * self._rng.uniform(1.0, 2.0), 2),
            currency="INR",
            ip_address=self._known_ip(),
            device_id=self._known_device(),
            user_agent="Mozilla/5.0",
            country="India",
            city=self._rng.choice(CITIES),
            api_endpoint="/api/v1/auth/token",
            http_method="POST",
            response_status=401,
            payment_method="card",
            failed_attempts=failed,
            transaction_frequency=round(self._rng.uniform(1.0, 5.0), 2),
            account_age_days=self._rng.randint(90, 1500),
            previous_transaction_avg=avg_amount,
            previous_transaction_count=self._rng.randint(5, 200),
            is_new_device=False,
            is_new_ip=False,
            scenario_label="multiple_failed_attempts",
            timestamp=datetime.now(timezone.utc),
        )

    def new_device(self, user_id: str, avg_amount: float = 1500.0) -> PaymentEvent:
        """Scenario C: First time seeing this device for this user."""
        return PaymentEvent(
            transaction_id=self._txn_id(),
            user_id=user_id,
            merchant_id=self._rng.randint(1, 5),
            amount=round(avg_amount * self._rng.uniform(0.8, 2.0), 2),
            currency="INR",
            ip_address=self._known_ip(),
            device_id=self._new_device(),
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17)",
            country="India",
            city=self._rng.choice(CITIES),
            api_endpoint="/api/v1/payments/create",
            http_method="POST",
            response_status=200,
            payment_method=self._rng.choice(PAYMENT_METHODS),
            failed_attempts=self._rng.randint(1, 3),
            transaction_frequency=round(self._rng.uniform(0.5, 4.0), 2),
            account_age_days=self._rng.randint(90, 1500),
            previous_transaction_avg=avg_amount,
            previous_transaction_count=self._rng.randint(5, 200),
            is_new_device=True,
            is_new_ip=False,
            scenario_label="new_device",
            timestamp=datetime.now(timezone.utc),
        )

    def suspicious_ip(self, user_id: str, avg_amount: float = 1500.0) -> PaymentEvent:
        """Scenario D: Transaction from foreign/suspicious IP."""
        foreign_country = self._rng.choice(["Russia", "Nigeria", "Unknown", "Netherlands"])
        return PaymentEvent(
            transaction_id=self._txn_id(),
            user_id=user_id,
            merchant_id=self._rng.randint(1, 5),
            amount=round(avg_amount * self._rng.uniform(0.5, 3.0), 2),
            currency="INR",
            ip_address=self._suspicious_ip(),
            device_id=self._known_device(),
            user_agent="curl/7.88.1",
            country=foreign_country,
            city="Unknown",
            api_endpoint="/api/v1/payments/create",
            http_method="POST",
            response_status=200,
            payment_method="card",
            failed_attempts=self._rng.randint(0, 3),
            transaction_frequency=round(self._rng.uniform(1.0, 6.0), 2),
            account_age_days=self._rng.randint(90, 1500),
            previous_transaction_avg=avg_amount,
            previous_transaction_count=self._rng.randint(5, 200),
            is_new_device=False,
            is_new_ip=True,
            scenario_label="suspicious_ip",
            timestamp=datetime.now(timezone.utc),
        )

    def api_burst(self, user_id: str, avg_amount: float = 1500.0) -> PaymentEvent:
        """Scenario E: Abnormally high request frequency — bot traffic."""
        freq = round(self._rng.uniform(20, 45), 2)
        return PaymentEvent(
            transaction_id=self._txn_id(),
            user_id=user_id,
            merchant_id=4,
            amount=round(avg_amount * self._rng.uniform(0.9, 1.2), 2),
            currency="INR",
            ip_address=self._known_ip(),
            device_id="DEV_BOT_AUTO",
            user_agent="python-requests/2.31.0",
            country="India",
            city=self._rng.choice(CITIES),
            api_endpoint="/api/v1/payments/batch",
            http_method="POST",
            response_status=429,
            payment_method="netbanking",
            failed_attempts=self._rng.randint(2, 6),
            transaction_frequency=freq,
            account_age_days=self._rng.randint(90, 1500),
            previous_transaction_avg=avg_amount,
            previous_transaction_count=self._rng.randint(5, 200),
            is_new_device=False,
            is_new_ip=False,
            scenario_label="api_burst",
            timestamp=datetime.now(timezone.utc),
        )

    def high_risk_payment(self, user_id: str, avg_amount: float = 1500.0) -> PaymentEvent:
        """
        Scenario F — Combined attack:
        High amount + new device + suspicious IP + many failed attempts + high frequency.
        """
        amount = round(avg_amount * self._rng.uniform(15, 40), 2)
        return PaymentEvent(
            transaction_id=self._txn_id(),
            user_id=user_id,
            merchant_id=3,  # CryptoExchangeX
            amount=amount,
            currency="INR",
            ip_address=self._suspicious_ip(),
            device_id=self._new_device(),
            user_agent="curl/7.68.0",
            country=self._rng.choice(["Russia", "Nigeria", "Unknown"]),
            city="Unknown",
            api_endpoint="/api/v1/payments/create",
            http_method="POST",
            response_status=200,
            payment_method="card",
            failed_attempts=self._rng.randint(8, 15),
            transaction_frequency=round(self._rng.uniform(20, 40), 2),
            account_age_days=self._rng.randint(90, 1500),
            previous_transaction_avg=avg_amount,
            previous_transaction_count=self._rng.randint(5, 200),
            is_new_device=True,
            is_new_ip=True,
            scenario_label="high_risk_payment",
            timestamp=datetime.now(timezone.utc),
        )
