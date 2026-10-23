"""
MediProcureIQ: Managed ML Training & Model Evaluation Benchmark
Domain: Healthcare Procurement & Hospital Supplier Risk Intelligence
Trains and evaluates:
1. Logistic Regression (Linear baseline matching BigQuery ML LOGISTIC_REG)
2. Random Forest Classifier (Ensemble Bagging)
3. Gradient Boosting Classifier (Ensemble Boosting matching BigQuery ML BOOSTED_TREE_CLASSIFIER)

Calculates REAL, un-fabricated evaluation metrics:
- Accuracy
- Precision
- Recall
- F1-Score
- ROC-AUC
- Confusion Matrix
- Feature Importance
"""

import os
import json
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)

def run_ml_benchmark():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    clean_csv = os.path.join(base_dir, "data", "hospital_procurement_clean.csv")

    if not os.path.exists(clean_csv):
        print(f"[ERROR] Clean dataset not found at: {clean_csv}")
        return False

    print(f"[*] Loading clean hospital procurement dataset from: {clean_csv}")
    df = pd.read_csv(clean_csv)
    print(f"    Loaded {len(df)} records across {len(df.columns)} features.")

    # Target variable: delayed_delivery (1 = Late Delivery, 0 = On-Time Delivery)
    target = 'delayed_delivery'
    feature_cols = [
        'supplier_rating',
        'historical_ontime_pct',
        'clinical_criticality',
        'cold_chain_required',
        'sterility_certified',
        'order_quantity',
        'unit_price_inr',
        'promised_lead_days',
        'item_category'
    ]

    X = df[feature_cols].copy()
    y = df[target].values

    # Train-test split (80% train, 20% test with stratification)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"    Training set size: {len(X_train)} | Testing set size: {len(X_test)}")
    print(f"    Class balance: {np.mean(y)*100:.1f}% delayed in full dataset.")

    # Preprocessing pipelines
    numeric_features = [
        'supplier_rating', 'historical_ontime_pct', 'clinical_criticality',
        'cold_chain_required', 'sterility_certified', 'order_quantity',
        'unit_price_inr', 'promised_lead_days'
    ]
    categorical_features = ['item_category']

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(drop='first', sparse_output=False), categorical_features)
        ]
    )

    models = {
        'Logistic Regression (BigQuery ML Baseline)': LogisticRegression(
            class_weight='balanced', max_iter=1000, random_state=42
        ),
        'Random Forest Classifier': RandomForestClassifier(
            n_estimators=100, max_depth=6, class_weight='balanced', random_state=42
        ),
        'Gradient Boosted Trees (BigQuery ML Boosted Tree)': GradientBoostingClassifier(
            n_estimators=120, learning_rate=0.1, max_depth=4, random_state=42
        )
    }

    results = {}
    print("\n" + "="*80)
    print(f"{'Model Name':<45} | {'Accuracy':<8} | {'Precision':<9} | {'Recall':<6} | {'F1':<6} | {'ROC-AUC':<7}")
    print("="*80)

    for name, clf in models.items():
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', clf)
        ])

        # Train model
        pipeline.fit(X_train, y_train)

        # Inference on holdout evaluation test set
        y_pred = pipeline.predict(X_test)
        y_prob = pipeline.predict_proba(X_test)[:, 1]

        acc = round(float(accuracy_score(y_test, y_pred)), 4)
        prec = round(float(precision_score(y_test, y_pred, zero_division=0)), 4)
        rec = round(float(recall_score(y_test, y_pred, zero_division=0)), 4)
        f1 = round(float(f1_score(y_test, y_pred, zero_division=0)), 4)
        auc = round(float(roc_auc_score(y_test, y_prob)), 4)

        cm = confusion_matrix(y_test, y_pred).tolist()
        # [[TN, FP], [FN, TP]]

        results[name] = {
            'accuracy': acc,
            'precision': prec,
            'recall': rec,
            'f1_score': f1,
            'roc_auc': auc,
            'confusion_matrix': {
                'true_negative': cm[0][0],
                'false_positive': cm[0][1],
                'false_negative': cm[1][0],
                'true_positive': cm[1][1]
            }
        }

        print(f"{name:<45} | {acc*100:6.2f}% | {prec*100:7.2f}% | {rec*100:5.2f}% | {f1*100:5.2f}% | {auc*100:6.2f}%")

    print("="*80)

    # Feature Importance analysis from Gradient Boosted Model
    gb_model = models['Gradient Boosted Trees (BigQuery ML Boosted Tree)']
    transformed_cats = pipeline.named_steps['preprocessor'].named_transformers_['cat'].get_feature_names_out(categorical_features)
    all_feature_names = list(numeric_features) + list(transformed_cats)
    importances = gb_model.feature_importances_
    feat_ranking = sorted(zip(all_feature_names, importances), key=lambda x: x[1], reverse=True)

    results['feature_importance'] = [
        {'feature': feat, 'importance_weight': round(float(weight), 4)}
        for feat, weight in feat_ranking
    ]

    print("\nTop 5 Predictive Features (Risk Drivers):")
    for feat, weight in feat_ranking[:5]:
        print(f"  - {feat}: {weight*100:.2f}% contribution")

    # Save output artifacts
    out_json = os.path.join(os.path.dirname(__file__), "model_metrics.json")
    with open(out_json, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n[SUCCESS] Saved Model Metrics JSON to: {out_json}")

    # Also mirror into backend directory for live API serving
    backend_json = os.path.abspath(os.path.join(base_dir, "..", "procureiq", "backend", "model_metrics.json"))
    os.makedirs(os.path.dirname(backend_json), exist_ok=True)
    with open(backend_json, "w") as f:
        json.dump(results, f, indent=2)
    print(f"[SUCCESS] Mirrored to Backend API path: {backend_json}")

    return results

if __name__ == '__main__':
    run_ml_benchmark()
