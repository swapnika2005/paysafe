import pandas as pd
import numpy as np
import os

np.random.seed(42)

print("🔄 Generating SafePay synthetic dataset...")

n_legit = 50000
n_fraud = 5000

# Legit hour weights
legit_hours = np.array([
    0.005, 0.003, 0.002, 0.002, 0.003, 0.010,
    0.030, 0.060, 0.080, 0.090, 0.090, 0.085,
    0.085, 0.080, 0.075, 0.070, 0.065, 0.060,
    0.055, 0.045, 0.035, 0.025, 0.015, 0.010,
])
legit_hours = legit_hours / legit_hours.sum()  # normalize to sum=1

# Fraud hour weights
fraud_hours = np.array([
    0.12, 0.14, 0.14, 0.12, 0.10, 0.08,
    0.05, 0.04, 0.04, 0.04, 0.04, 0.04,
    0.04, 0.03, 0.03, 0.03, 0.02, 0.02,
    0.02, 0.02, 0.02, 0.02, 0.02, 0.03,
])
fraud_hours = fraud_hours / fraud_hours.sum()  # normalize to sum=1

# Legitimate transactions
legit = pd.DataFrame({
    'amount': np.random.lognormal(mean=8.5, sigma=1.2, size=n_legit),
    'hour_of_day': np.random.choice(range(24), n_legit, p=legit_hours),
    'sender_txn_count': np.random.randint(5, 200, n_legit),
    'receiver_txn_count': np.random.randint(3, 150, n_legit),
    'is_fraud': 0
})

# Fraudulent transactions
fraud = pd.DataFrame({
    'amount': np.random.lognormal(mean=11.5, sigma=0.9, size=n_fraud),
    'hour_of_day': np.random.choice(range(24), n_fraud, p=fraud_hours),
    'sender_txn_count': np.random.randint(0, 8, n_fraud),
    'receiver_txn_count': np.random.randint(0, 5, n_fraud),
    'is_fraud': 1
})

# Combine + shuffle
df = pd.concat([legit, fraud], ignore_index=True)
df['amount'] = df['amount'].clip(10, 500000)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

print(f"\n✅ Dataset generated!")
print(f"   Total rows:  {len(df):,}")
print(f"   Legit:       {n_legit:,}")
print(f"   Fraud:       {n_fraud:,}")
print(f"   Fraud rate:  {n_fraud/(n_legit+n_fraud)*100:.1f}%")
print(f"\n── Amount Stats ──")
print(f"   Legit avg:   Rs. {legit['amount'].mean():,.0f}")
print(f"   Fraud avg:   Rs. {fraud['amount'].mean():,.0f}")
print(f"\n── Hour Stats ──")
print(f"   Legit peak:  {legit['hour_of_day'].mode()[0]}:00")
print(f"   Fraud peak:  {fraud['hour_of_day'].mode()[0]}:00")

os.makedirs('data', exist_ok=True)
df.to_csv('data/safepay_transactions.csv', index=False)
print(f"\n💾 Saved → data/safepay_transactions.csv")
