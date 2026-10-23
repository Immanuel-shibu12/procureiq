# MediProcureIQ: Cloud Architecture & Systems Design
**Target Cloud Platform:** Google Cloud Platform (GCP)  
**Academic Course:** Cloud Computing & Full Stack Development  
**Target Domain:** Health (Hospital Procurement & Critical Medical Supply Chain Risk)  

---

## 1. Cloud Architecture Overview

MediProcureIQ is an end-to-end cloud-native intelligent procurement platform designed to mitigate medical equipment stockouts, combat supplier defaults, and enforce strict institutional governance in healthcare environments.

```
                           [ Healthcare ERP / Hospital Hospital Info System ]
                                                    │
                                                    ▼
                       STAGE 1: [ Google Cloud Storage (GCS) Bucket ]
                                 gs://mediprocureiq-raw-data/
                                                    │
                                                    ▼ (Object Finalize Event)
                       STAGE 2: [ GCP Cloud Functions (2nd Gen) ]
                                 Automated Serverless ETL Pipeline
                                                    │
                                                    ▼ (Streaming / Batch Ingestion)
                       STAGE 3: [ Google BigQuery Enterprise Warehouse ]
                                 mediprocureiq_analytics.hospital_procurement_clean
                                   │                              │
                                   ▼                              ▼
                 STAGE 4: [ BigQuery ML Engine ]         STAGE 5: [ Google Looker Studio ]
                  • Logistic Regression                   • Hospital Department Spend
                  • Boosted Trees (XGBoost)               • Supplier Performance Matrix
                  • Defect Risk Classification            • Real-time Risk Filter Gauges
                                   │
                                   ▼
                 [ Full-Stack MediProcureIQ Platform ]
                  • Docker Containerized (Frontend + Backend + MongoDB)
                  • Automated CI/CD via GitHub Actions
                  • Strict Segregation of Duties (SoD) & No-Self-Approval
```

---

## 2. Component Specifications

### A. Data Ingestion: Google Cloud Storage (GCS)
* **Bucket Name:** `gs://mediprocureiq-raw-data`
* **Storage Class:** Standard Regional (`us-central1` or `asia-south1`)
* **Object Lifecycle:** Raw datasets are versioned with automated retention policies.
* **Security:** Uniform Bucket-Level Access (UBLA), Server-side encryption with Google-managed keys (SSE-KMS), and signed URLs for secure uploads.

### B. Serverless ETL: GCP Cloud Functions (2nd Gen) / Cloud Run Functions
* **Runtime:** Python 3.11 (`functions-framework`)
* **Trigger:** Cloud Storage Event Trigger (`google.storage.object.v1.finalized`)
* **Scaling:** Scales to zero when idle; $0$ ongoing server cost.
* **Transformations:**
  * Deduplication on clinical `order_id`.
  * Missing value imputation (median rating and on-time percentage).
  * Feature engineering:
    * Lead time variance: $\Delta = \text{Actual Lead Days} - \text{Promised Lead Days}$
    * Clinical Criticality Score (Tier 1 to Tier 3)
    * Cold-Chain Risk Hazard Flag
    * Composite Supplier Health Risk Index ($0$ to $100$)

### C. Data Warehouse & Managed ML: Google BigQuery
* **Dataset ID:** `mediprocureiq_analytics`
* **Partitioning & Clustering:** Clustered by `item_category` and partitioned by `order_date`.
* **Managed Machine Learning (BigQuery ML):**
  * `supplier_delay_logistic_reg` (LOGISTIC_REG baseline)
  * `supplier_delay_boosted_tree` (BOOSTED_TREE_CLASSIFIER)
  * Models train and infer inside BigQuery SQL without moving data outside the cloud perimeter.

### D. Business Intelligence: Google Looker Studio
* **Integration:** Native BigQuery Direct SQL Connector.
* **Visualizations:** Departmental spend distributions, supplier risk radar matrices, delay incidence tracking, and executive scorecards.

### E. Containerization & Orchestration
* **Backend:** Node.js 20 Alpine container with built-in `/api/health` checking and persistent MongoDB connector.
* **Frontend:** Multi-stage Vite React build served via Nginx Alpine with built-in `/api/` reverse proxy.
* **Local Orchestration:** `docker-compose.yml` spinning up Frontend, Backend, and MongoDB 7.0 in isolated container networks.

---

## 3. Security, Governance & IAM Architecture

1. **Principle of Least Privilege (PoLP):** Cloud Function execution service account only holds `roles/storage.objectViewer` and `roles/bigquery.dataEditor`.
2. **Stateless Authentication:** JSON Web Tokens (JWT) with HS256 signatures, short expiration, and client-side safe storage.
3. **Institutional Governance (Segregation of Duties):**
   * Role-Based Access Control (`Requester`, `Officer`, `Approver`, `Admin`).
   * **Strict No-Self-Approval Enforcement:** Even if an Admin creates a purchase request, the backend prevents them from approving their own request.
   * **Mandatory Rejection Reasons:** Zero silent rejections allowed in clinical requisitions.

---

## 4. Cost Optimization & Free Tier Compliance

* **GCS:** Under 5 GB free tier storage limit.
* **Cloud Functions:** Within the 2,000,000 monthly free invocations.
* **BigQuery:** 10 GB active storage and 1 TB query analysis per month free.
* **Local Simulation:** Complete local Python execution runner (`cloud/etl/etl_local_runner.py`) and ML benchmark runner (`cloud/ml/train_and_evaluate_ml.py`) allowing 100% offline development with zero billable cloud usage.
