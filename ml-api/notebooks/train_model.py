import pandas as pd
import numpy as np
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score
)

print("🔄 Loading dataset...")
df = pd.read_csv('data/safepay_transactions.csv')
print(f"   Rows: {len(df):,}")
print(f"   Fraud rate: {df['is_fraud'].mean()*100:.1f}%")

# ── Features ──────────────────────────────
FEATURES = [
    'amount',
    'hour_of_day',
    'sender_txn_count',
    'receiver_txn_count'
]
TARGET = 'is_fraud'

# ── Scale amount ──────────────────────────
print("\n🔄 Scaling features...")
scaler = StandardScaler()
df['amount'] = scaler.fit_transform(df[['amount']])

X = df[FEATURES]
y = df[TARGET]

# ── Train/Test Split ──────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y     # keeps fraud ratio same in both splits
)

print(f"   Train: {len(X_train):,} rows")
print(f"   Test:  {len(X_test):,} rows")

# ── Train Model ───────────────────────────
print("\n🔄 Training Random Forest...")
print("   (this takes 30-60 seconds...)")

model = RandomForestClassifier(
    n_estimators=200,      # 200 trees
    max_depth=15,          # max tree depth
    min_samples_split=5,
    random_state=42,
    class_weight='balanced',  # handles imbalance
    n_jobs=-1              # use all CPU cores
)

model.fit(X_train, y_train)
print("   ✅ Training complete!")

# ── Evaluate ──────────────────────────────
print("\n── Model Performance ──────────────────")
y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]

print(classification_report(
    y_test, y_pred,
    target_names=['Legitimate', 'Fraud']
))

# Confusion matrix
cm = confusion_matrix(y_test, y_pred)
print("── Confusion Matrix ───────────────────")
print(f"   True Legit:  {cm[0][0]:,}  |  False Fraud: {cm[0][1]:,}")
print(f"   False Legit: {cm[1][0]:,}  |  True Fraud:  {cm[1][1]:,}")

# ROC-AUC
roc = roc_auc_score(y_test, y_proba)
print(f"\n   ROC-AUC Score: {roc:.4f}")

# Feature importance
print("\n── Feature Importance ─────────────────")
for feat, imp in zip(FEATURES, model.feature_importances_):
    bar = "█" * int(imp * 50)
    print(f"   {feat:<22} {imp:.4f}  {bar}")

# ── Save ──────────────────────────────────
print("\n💾 Saving model files...")
os.makedirs('model', exist_ok=True)

joblib.dump(model,    'model/safepay_fraud_model.pkl')
joblib.dump(scaler,   'model/safepay_scaler.pkl')
joblib.dump(FEATURES, 'model/safepay_features.pkl')

print("   ✅ model/safepay_fraud_model.pkl")
print("   ✅ model/safepay_scaler.pkl")
print("   ✅ model/safepay_features.pkl")
print("\n🎉 Done! Model ready for FastAPI.")

