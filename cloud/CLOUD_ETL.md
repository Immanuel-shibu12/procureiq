# MediProcureIQ: Cloud ETL Pipeline Documentation
**Cloud Services:** Google Cloud Storage (GCS) &rarr; GCP Cloud Functions &rarr; Google BigQuery  
**Pipeline Type:** Event-driven Serverless Extract, Transform, Load (ETL)  
**Domain:** Hospital Medical Procurement & Clinical Supply Chain  

---

## 1. ETL Architecture Flow

```
[ Healthcare Data Source ]
         │ (CSV Upload)
         ▼
[ Google Cloud Storage ] (gs://mediprocureiq-raw-data/raw/*.csv)
         │
         ▼ (Cloud Event: google.storage.object.v1.finalized)
[ GCP Cloud Function ] (mediprocureiq-etl / Python 3.11)
         │
         ├── 1. Extraction: Stream CSV into memory
         ├── 2. Validation: Range checks & schema verification
         ├── 3. Cleaning: Deduplication & median imputation
         ├── 4. Feature Engineering:
         │      • Lead time variance (actual - promised)
         │      • Clinical criticality index (Tiers 1, 2, 3)
         │      • Cold-chain hazard flag
         │      • Composite supplier health risk index (0 - 100)
         │
         ▼ (Streaming / Direct BigQuery Table Write)
[ Google BigQuery ] (mediprocureiq_analytics.hospital_procurement_clean)
```

---

## 2. Dataset Schema & Data Dictionary

The cleaned analytical table contains **1,200 clinical procurement records across 25 schema fields**:

| Column Name | Data Type | Description | Range / Values |
| :--- | :--- | :--- | :--- |
| `order_id` | STRING | Unique Hospital Requisition Identifier | e.g. `PO-MED-1001` |
| `order_date` | DATE | Date purchase order was raised | `2025-01-01` to `2026-03-01` |
| `hospital_department` | STRING | Clinical department ordering items | Cardiology, ICU, Surgery, Oncology, etc. |
| `item_category` | STRING | Health supply domain category | ICU Equipment, Pharmaceuticals, Surgical, PPE, Diagnostic |
| `item_name` | STRING | Clinical item nomenclature | e.g., Ventilator Tubing, Propofol, N95 Respirators |
| `supplier_name` | STRING | Medical vendor organization | e.g., BioMed Diagnostics, MedTech ICU Systems |
| `supplier_rating` | FLOAT | Historical inspection score | `1.0` to `5.0` |
| `historical_ontime_pct` | FLOAT | Long-term fulfillment rate | `45.0%` to `100.0%` |
| `cold_chain_required` | INTEGER | Temperature control required flag | `0` = Ambient, `1` = Strict Refrigeration |
| `sterility_certified` | INTEGER | Autoclave sterility validation | `0` = Non-sterile, `1` = Sterile certified |
| `order_quantity` | INTEGER | Number of clinical units ordered | `10` to `1000` |
| `unit_price_inr` | FLOAT | Price per unit in Indian Rupees | `₹45.00` to `₹145,000.00` |
| `total_spend_inr` | FLOAT | Total PO value ($Qty \times Unit Price$) | Derived currency amount |
| `promised_lead_days` | INTEGER | Agreed delivery SLA window | `3` to `16` days |
| `actual_lead_days` | INTEGER | Actual days elapsed to fulfillment | `1` to `25` days |
| `promised_delivery_date` | DATE | Expected delivery date | Date string |
| `actual_delivery_date` | DATE | Confirmed goods receipt date | Date string |
| `delayed_delivery` | INTEGER | **Target 1:** Late delivery indicator | `0` = On-time, `1` = Delayed |
| `defect_flag` | INTEGER | **Target 2:** Batch defect / recall | `0` = Pristine, `1` = Defect detected |
| `risk_label` | STRING | Categorical risk grade | `Low`, `Medium`, `High` |
| `lead_time_variance_days`| INTEGER | **Engineered:** Overrun days ($\Delta$) | Negative = Early, Positive = Delayed |
| `clinical_criticality` | INTEGER | **Engineered:** Severity tier | `1` (PPE), `2` (Pharma), `3` (ICU/Surgery) |
| `cold_chain_risk` | INTEGER | **Engineered:** Temperature breach flag | `1` if cold chain was required and delayed |
| `composite_risk_score` | FLOAT | **Engineered:** Composite risk index | `0.0` to `100.0` (higher is riskier) |
| `data_source` | STRING | Provenance tracking tag | Hospital ERP Logistics Core |

---

## 3. Transformation & Cleansing Logic

### A. Deduplication
Ensures institutional idempotent processing by dropping duplicate `order_id` records:
```python
df = df.drop_duplicates(subset=['order_id']).copy()
```

### B. Missing Value Imputation
* **Supplier Rating:** Replaced missing values with the median rating ($4.2$) and clamped between $1.0$ and $5.0$.
* **Historical On-time %:** Imputed with median on-time compliance ($88.0\%$).
* **Clinical Flags:** Clamped to binary integers ($0$ or $1$).

### C. Feature Engineering Formulas
1. **Lead Time Variance:**
   $$\Delta_{\text{lead}} = \text{actual\_lead\_days} - \text{promised\_lead\_days}$$
2. **Cold Chain Risk:**
   $$\text{ColdChainRisk} = \begin{cases} 1 & \text{if } \text{cold\_chain} = 1 \text{ and } \text{delayed} = 1 \\ 0 & \text{otherwise} \end{cases}$$
3. **Composite Risk Score ($0 - 100$):**
   $$\text{Score} = \min\left(100, (5.0 - \text{Rating}) \times 12.0 + (100 - \text{OnTime\%}) \times 0.45 + \text{Delayed} \times 25.0 + \text{Defect} \times 30.0\right)$$

---

## 4. Execution & Testing Instructions

### Local Testing (Offline Simulation Mode)
Run the local pipeline without any GCP credentials:
```bash
# 1. Generate Raw Hospital Procurement Data
python cloud/etl/generate_dataset.py

# 2. Stage to Simulated GCS Storage
python cloud/etl/gcs_upload.py

# 3. Execute Serverless ETL Transformation
python cloud/etl/etl_local_runner.py
```

### Live GCP Cloud Deployment
When deploying to live Google Cloud Platform:
```bash
# 1. Deploy Cloud Storage Bucket
gcloud storage buckets create gs://mediprocureiq-raw-data --location=us-central1

# 2. Deploy Cloud Function (2nd Gen)
gcloud functions deploy mediprocureiq-etl \
  --gen2 \
  --runtime=python311 \
  --region=us-central1 \
  --source=./cloud/etl/cloud_function \
  --entry-point=transform_procurement_event \
  --trigger-event-filters="type=google.cloud.storage.object.v1.finalized" \
  --trigger-event-filters="bucket=mediprocureiq-raw-data"

# 3. Upload File to Trigger Automated Pipeline
gcloud storage cp cloud/data/hospital_procurement_raw.csv gs://mediprocureiq-raw-data/raw/hospital_procurement_raw.csv
```
