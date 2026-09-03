import requests
import time
import json
import uuid

BASE_URL = "http://localhost:3000/api"

def print_result(phase, condition, result):
    icon = "PASS" if result else "FAIL"
    print(f"[{phase}] {icon} {condition}")

def test_auth():
    print("\n--- PHASE 4: AUTHENTICATION ---")
    
    # 1. Registration
    email = f"test_{uuid.uuid4()}@example.com"
    pw = "StrongPass123"
    
    # Missing email
    r = requests.post(f"{BASE_URL}/auth/register", json={"password": pw, "full_name": "Test"})
    print_result("Register", "Missing email", r.status_code == 400)
    
    # Valid registration
    r = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": pw, "full_name": "Test User"})
    print_result("Register", "Valid registration", r.status_code == 201)
    
    # Duplicate email
    r = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": pw, "full_name": "Test User"})
    print_result("Register", "Duplicate email", r.status_code == 400)
    
    # 2. Login
    # Wrong password
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": "WrongPassword"})
    print_result("Login", "Wrong password", r.status_code == 401)
    
    # Nonexistent user
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": "nonexistent@example.com", "password": pw})
    print_result("Login", "Nonexistent user", r.status_code == 401)
    
    # Valid login
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": pw})
    print_result("Login", "Valid credentials", r.status_code == 200)
    token = r.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. /auth/me
    r = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print_result("/auth/me", "Valid JWT", r.status_code == 200 and r.json()["email"] == email)
    
    r = requests.get(f"{BASE_URL}/auth/me")
    print_result("/auth/me", "No JWT", r.status_code == 401)
    
    r = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": "Bearer invalid"})
    print_result("/auth/me", "Invalid JWT", r.status_code == 401)
    
    return headers, email

def test_transactions(headers, user_id):
    print("\n--- PHASE 6: TRANSACTION API ---")
    
    # Create valid transaction
    txn_id = f"txn_{uuid.uuid4()}"
    txn_data = {
        "transactionId": txn_id,
        "userId": user_id,
        "amount": 1500.0,
        "currency": "INR",
        "paymentMethod": "credit_card",
        "ipAddress": "192.168.1.1",
        "deviceId": "dev_123"
    }
    
    r = requests.post(f"{BASE_URL}/transactions", json=txn_data, headers=headers)
    print_result("Transaction", "Create transaction", r.status_code == 201)
    
    # Duplicate ID
    r = requests.post(f"{BASE_URL}/transactions", json=txn_data, headers=headers)
    print_result("Transaction", "Duplicate transaction ID", r.status_code == 409)
    
    # Invalid amount
    bad_txn = txn_data.copy()
    bad_txn["transactionId"] = f"txn_{uuid.uuid4()}"
    bad_txn["amount"] = -50
    r = requests.post(f"{BASE_URL}/transactions", json=bad_txn, headers=headers)
    print_result("Transaction", "Negative amount", r.status_code == 400)
    
    # Get Transactions
    r = requests.get(f"{BASE_URL}/transactions", headers=headers)
    print_result("Transaction", "List transactions", r.status_code == 200 and len(r.json()["items"]) > 0)
    
    # Get Specific Transaction
    r = requests.get(f"{BASE_URL}/transactions/{txn_id}", headers=headers)
    print_result("Transaction", "Get specific transaction", r.status_code == 200 and r.json()["transaction_id"] == txn_id)
    
    return txn_id

def test_simulation(headers):
    print("\n--- PHASE 12: SIMULATION SYSTEM ---")
    r = requests.get(f"{BASE_URL}/simulation/status", headers=headers)
    print_result("Simulation", "Status check", r.status_code == 200)
    
    r = requests.post(f"{BASE_URL}/simulation/start?rate=1&suspicious_ratio=0.5", headers=headers)
    print_result("Simulation", "Start simulation", r.status_code == 200)
    
    time.sleep(2)
    
    r = requests.post(f"{BASE_URL}/simulation/stop", headers=headers)
    print_result("Simulation", "Stop simulation", r.status_code == 200)
    
    r = requests.post(f"{BASE_URL}/simulation/scenario", json={"scenario": "high_risk_payment"}, headers=headers)
    print_result("Simulation", "Trigger high_risk_payment scenario", r.status_code == 200)
    
    if r.status_code == 200:
        return r.json()["transaction_id"]
    return None

if __name__ == "__main__":
    headers, email = test_auth()
    # Get user_id
    r = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    user_id = str(r.json()["_id"])
    
    test_transactions(headers, user_id)
    high_risk_txn = test_simulation(headers)
    
    print("\nDone with backend integration tests.")
