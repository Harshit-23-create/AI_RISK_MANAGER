"""
simulation/attack_generator.py

Dedicated attack pattern generator.
Composes PaymentGenerator scenarios into multi-step attack sequences
that mimic real-world fraud patterns.

Usage:
    from simulation.attack_generator import AttackGenerator
    gen = AttackGenerator()
    events = gen.credential_stuffing("USER_0050")
"""
import uuid
from datetime import datetime, timezone
from typing import List

from simulation.payment_generator import PaymentGenerator, PaymentEvent


class AttackGenerator:
    """
    Generates multi-event attack sequences.
    Each method returns a list of events that together form
    a coherent attack pattern for testing the risk engine.
    """

    def __init__(self, seed: int = None):
        self._gen = PaymentGenerator(seed=seed)

    def credential_stuffing(self, user_id: str, avg_amount: float = 1500.0, n_attempts: int = 10) -> List[PaymentEvent]:
        """
        Credential stuffing: many failed login/payment attempts
        from a new IP, followed by a successful high-value transaction.
        """
        events = []
        # Phase 1: many failed attempts
        for i in range(n_attempts - 1):
            ev = self._gen.multiple_failed_attempts(user_id, avg_amount)
            ev.failed_attempts = i + 1   # escalating
            events.append(ev)
        # Phase 2: successful high-value transaction
        events.append(self._gen.unusual_amount(user_id, avg_amount))
        return events

    def account_takeover(self, user_id: str, avg_amount: float = 1500.0) -> List[PaymentEvent]:
        """
        ATO pattern: suspicious IP + new device + high amount.
        Simulates a compromised account being used from a new device.
        """
        return [
            self._gen.suspicious_ip(user_id, avg_amount),
            self._gen.new_device(user_id, avg_amount),
            self._gen.unusual_amount(user_id, avg_amount),
        ]

    def bot_sweep(self, user_id: str, avg_amount: float = 1500.0, n_requests: int = 20) -> List[PaymentEvent]:
        """
        Bot sweep: rapid API requests followed by a high-risk payment.
        """
        events = [self._gen.api_burst(user_id, avg_amount) for _ in range(n_requests)]
        events.append(self._gen.high_risk_payment(user_id, avg_amount))
        return events

    def combined_fraud(self, user_id: str, avg_amount: float = 1500.0) -> List[PaymentEvent]:
        """
        Maximum risk scenario combining all attack signals.
        Should trigger BLOCK with very high confidence.
        """
        return [self._gen.high_risk_payment(user_id, avg_amount)]

    def new_mule_account(self) -> List[PaymentEvent]:
        """
        Money mule: brand-new account with no history
        immediately attempting high-value transfers.
        """
        mule_id = f"MULE_{uuid.uuid4().hex[:6].upper()}"
        # New account, many rapid high-value transactions
        events = []
        for i in range(5):
            ev = self._gen.unusual_amount(mule_id, avg_amount=500.0)
            ev.account_age_days = 0
            ev.previous_transaction_count = i
            ev.previous_transaction_avg = 0.0
            ev.scenario_label = "new_account"
            events.append(ev)
        return events
