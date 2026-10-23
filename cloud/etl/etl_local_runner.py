"""
Local ETL Runner (MediProcureIQ)
Executes the identical Cloud Function transformation rules locally without requiring active GCP credentials.
Generates: cloud/data/hospital_procurement_clean.csv
"""

import os
import sys
import pandas as pd

# Import transformation function from Cloud Function module
sys.path.append(os.path.join(os.path.dirname(__file__), 'cloud_function'))
from main import clean_and_transform_dataframe

def run_local_etl():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    raw_path = os.path.join(base_dir, "data", "hospital_procurement_raw.csv")
    clean_path = os.path.join(base_dir, "data", "hospital_procurement_clean.csv")

    if not os.path.exists(raw_path):
        print(f"[ERROR] Raw dataset missing at: {raw_path}")
        return False

    print(f"[*] Reading raw hospital procurement records from: {raw_path}")
    df_raw = pd.read_csv(raw_path)
    print(f"    Raw records: {len(df_raw)} rows, {len(df_raw.columns)} columns")

    print("[*] Executing Cloud ETL Transformation Pipeline...")
    df_clean = clean_and_transform_dataframe(df_raw)

    os.makedirs(os.path.dirname(clean_path), exist_ok=True)
    df_clean.to_csv(clean_path, index=False)

    print(f"[SUCCESS] ETL Pipeline Completed successfully!")
    print(f"    Cleaned dataset: {clean_path}")
    print(f"    Total Processed Rows: {len(df_clean)}")
    print(f"    Total Features: {len(df_clean.columns)}")
    print("\nFeature Summary:")
    print(f"    Delayed Delivery Rate: {df_clean['delayed_delivery'].mean()*100:.1f}%")
    print(f"    Defect Rate: {df_clean['defect_flag'].mean()*100:.1f}%")
    print(f"    Cold Chain Risk Incidents: {df_clean['cold_chain_risk'].sum()}")
    print(f"    Mean Composite Risk Score: {df_clean['composite_risk_score'].mean():.2f}/100")
    print(f"    Total Hospital Procurement Value: INR {df_clean['total_spend_inr'].sum():,.2f}")
    return True

if __name__ == '__main__':
    run_local_etl()
