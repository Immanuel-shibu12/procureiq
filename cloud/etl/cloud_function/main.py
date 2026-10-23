"""
GCP Cloud Function (2nd Gen) / Cloud Run Function: MediProcureIQ ETL Pipeline
Entry Point: transform_procurement_event
Trigger: google.storage.object.finalize (GCS Bucket Event) or Direct HTTP POST

Performs:
1. Automated ingestion from Google Cloud Storage (GCS)
2. Schema validation, cleansing, and duplicate elimination
3. Feature enrichment (Lead Time Variance, Clinical Criticality Tier, Composite Risk Index)
4. Streaming / Batch load into Google BigQuery: mediprocureiq_analytics.hospital_procurement_clean
"""

import os
import io
import json
import logging
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mediprocureiq-etl")

CRITICALITY_MAP = {
    'ICU Equipment': 3,       # Life-critical
    'Surgical Supplies': 3,   # Operating theater sterile
    'Pharmaceuticals': 2,    # Clinical therapeutic
    'Diagnostic Devices': 2, # Diagnostic decision
    'PPE & Sanitization': 1  # Standard protective barrier
}

def clean_and_transform_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Core transformation and cleaning rules applied to raw hospital procurement data."""
    initial_count = len(df)
    
    # 1. Deduplicate by order_id
    df = df.drop_duplicates(subset=['order_id']).copy()
    
    # 2. Schema validation and type casting
    numeric_cols = [
        'supplier_rating', 'historical_ontime_pct', 'order_quantity',
        'unit_price_inr', 'total_spend_inr', 'promised_lead_days',
        'actual_lead_days', 'delayed_delivery', 'defect_flag',
        'cold_chain_required', 'sterility_certified'
    ]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

    # 3. Handle anomalies and missing values
    df['supplier_rating'] = df['supplier_rating'].fillna(df['supplier_rating'].median()).clip(1.0, 5.0)
    df['historical_ontime_pct'] = df['historical_ontime_pct'].fillna(df['historical_ontime_pct'].median()).clip(0.0, 100.0)
    df['delayed_delivery'] = df['delayed_delivery'].fillna(0).astype(int)
    df['defect_flag'] = df['defect_flag'].fillna(0).astype(int)
    
    # 4. Feature Enrichment:
    # A. Lead time variance: positive indicates delivery overrun, negative indicates ahead of schedule
    df['lead_time_variance_days'] = df['actual_lead_days'] - df['promised_lead_days']
    
    # B. Clinical Criticality Tier (1=Low, 2=Moderate, 3=Life Critical)
    df['clinical_criticality'] = df['item_category'].map(CRITICALITY_MAP).fillna(1).astype(int)
    
    # C. Cold-Chain Risk Exposure Flag
    df['cold_chain_risk'] = ((df['cold_chain_required'] == 1) & (df['delayed_delivery'] == 1)).astype(int)
    
    # D. Composite Supplier Health Risk Score (0 to 100, where higher is riskier)
    # Penalizes low ratings, low on-time %, defect history, and delivery delays
    rating_penalty = (5.0 - df['supplier_rating']) * 12.0
    ontime_penalty = (100.0 - df['historical_ontime_pct']) * 0.45
    delay_penalty = df['delayed_delivery'] * 25.0
    defect_penalty = df['defect_flag'] * 30.0
    raw_risk = rating_penalty + ontime_penalty + delay_penalty + defect_penalty
    df['composite_risk_score'] = np.clip(raw_risk, 0.0, 100.0).round(1)

    logger.info(f"Cleaned {len(df)} records (deduplicated from {initial_count}). Average Risk Score: {df['composite_risk_score'].mean():.2f}")
    return df

def transform_procurement_event(event, context=None):
    """
    Cloud Function 2nd Gen event handler triggered by GCS bucket finalization.
    """
    bucket_name = event.get('bucket', 'mediprocureiq-raw-data')
    file_name = event.get('name', 'raw/hospital_procurement_raw.csv')
    
    logger.info(f"Received GCS event for gs://{bucket_name}/{file_name}")

    try:
        from google.cloud import storage, bigquery
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(file_name)
        
        content = blob.download_as_text()
        raw_df = pd.read_csv(io.StringIO(content))
        
        clean_df = clean_and_transform_dataframe(raw_df)
        
        # Load clean dataframe into Google BigQuery
        project_id = os.environ.get('GCP_PROJECT_ID', storage_client.project)
        dataset_id = os.environ.get('BIGQUERY_DATASET', 'mediprocureiq_analytics')
        table_id = os.environ.get('BIGQUERY_TABLE', 'hospital_procurement_clean')
        full_table_id = f"{project_id}.{dataset_id}.{table_id}"
        
        bq_client = bigquery.Client(project=project_id)
        job_config = bigquery.LoadJobConfig(
            write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
            autodetect=True
        )
        job = bq_client.load_table_from_dataframe(clean_df, full_table_id, job_config=job_config)
        job.result()
        
        logger.info(f"Successfully loaded {len(clean_df)} records into BigQuery: {full_table_id}")
        return json.dumps({"status": "success", "rows_ingested": len(clean_df), "table": full_table_id}), 200
        
    except Exception as e:
        logger.error(f"Error in Cloud Function ETL execution: {e}")
        return json.dumps({"status": "error", "message": str(e)}), 500

def http_handler(request):
    """HTTP trigger entry point for Cloud Run / Functions HTTP invocations."""
    try:
        if request.method == 'POST' and request.files.get('file'):
            f = request.files['file']
            df = pd.read_csv(f)
        else:
            return json.dumps({"message": "Send a POST with a multipart CSV file or trigger via GCS"}), 400
        
        clean_df = clean_and_transform_dataframe(df)
        return clean_df.to_json(orient='records'), 200, {'Content-Type': 'application/json'}
    except Exception as e:
        return json.dumps({"error": str(e)}), 500
