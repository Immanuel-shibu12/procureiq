# MediProcureIQ: Cloud-Based Hospital Procurement & Supplier Risk Intelligence Platform

[![Build & Test](https://github.com/Immanuel-shibu12/procureiq/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Immanuel-shibu12/procureiq/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GCP: BigQuery ML](https://img.shields.io/badge/GCP-BigQuery%20ML-4285F4.svg?logo=google-cloud)](cloud/BIGQUERY_ML_EVALUATION.md)
[![Docker: Ready](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker)](docker-compose.yml)
[![Tests: 57 Passed](https://img.shields.io/badge/Tests-57%20Passed-brightgreen.svg)](procureiq/backend/test.js)

MediProcureIQ is an enterprise-grade cloud procurement intelligence platform engineered for modern healthcare institutions and hospital networks. Designed to prevent life-critical clinical supply disruptions, eliminate rogue spending, and enforce institutional governance (Segregation of Duties), MediProcureIQ combines a **full-stack operational engine** with **Google Cloud Platform (GCP)** managed machine learning, serverless ETL, and business intelligence.

---

## 🏛️ System Architecture

```
                    [ Hospital ERP / HIS Clinical Requisition Stream ]
                                            │
                                            ▼
               STAGE 1: [ Google Cloud Storage (GCS) Bucket ]
                         gs://mediprocureiq-raw-data/
                                            │
                                            ▼ (Cloud Storage Object Finalize)
               STAGE 2: [ GCP Cloud Functions (2nd Gen) Serverless ETL ]
                         • Automated Deduplication & Range Verification
                         • Clinical Criticality Tiering & Lead Time Variance
                                            │
                                            ▼ (Automated Streaming / Batch Load)
               STAGE 3: [ Google BigQuery Data Warehouse ]
                         mediprocureiq_analytics.hospital_procurement_clean
                           │                               │
                           ▼                               ▼
         STAGE 4: [ BigQuery ML Engine ]          STAGE 5: [ Google Looker Studio ]
          • Logistic Regression (Baseline)         • Hospital Spend Analysis
          • Boosted Trees (XGBoost)                • Real-time Supplier Risk Matrix
          • Defect Risk Classification             • Critical Cold-Chain Gauges
                           │
                           ▼
         [ Full-Stack MediProcureIQ Web Platform ]
          • Vite React Minimalist Dark Theme
          • Express.js REST API & Mongoose Engine
          • Strict No-Self-Approval Institutional Governance
          • 57 Passing Automated Unit & Integration Tests
```

---

## 📊 BigQuery ML Model Benchmark (Actual Measured Metrics)

Evaluated across **1,200 hospital procurement records** ($80/20$ stratified holdout test split):

| Model Architecture | Accuracy | Precision | Recall | F1-Score | ROC-AUC | Clinical Primary Use Case |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Logistic Regression (`LOGISTIC_REG`)** | **76.67%** | **41.89%** | **70.45%** | **52.54%** | **78.06%** | High sensitivity; catches $70.5\%$ of delayed shipments (best for critical ICU drugs). |
| **Random Forest Classifier** | **78.75%** | **44.26%** | **61.36%** | **51.43%** | **74.81%** | Balanced ensemble performance across clinical categories. |
| **Gradient Boosted Trees (`BOOSTED_TREE`)** | **81.67%** | **50.00%** | **38.64%** | **43.59%** | **69.63%** | Highest precision ($50\%$) and accuracy; minimizes false alarm fatigue. |

*Detailed confusion matrices, ROC curves, and feature importance rankings are documented in [`cloud/BIGQUERY_ML_EVALUATION.md`](cloud/BIGQUERY_ML_EVALUATION.md).*

---

## ⚡ Quickstart Guide (Windows 11 & VS Code)

### Prerequisites
* **Node.js 20+** installed.
* **Python 3.11+** installed (with `pandas` and `scikit-learn`).
* **Docker Desktop** (Optional, for containerized run).

### 1. Local Full-Stack Launch
```powershell
# In Windows PowerShell / VS Code Terminal:
cd C:\Users\imman\Downloads\procureiq

# Start backend and frontend simultaneously:
.\start.ps1
```
* **Frontend Application:** [http://127.0.0.1:5173/](http://127.0.0.1:5173/)
* **Backend API:** [http://127.0.0.1:5000/api/health](http://127.0.0.1:5000/api/health)

### 2. Demonstration Credentials
* **Password for all demo accounts:** `Password@123`
* **Ravi Requester:** `requester@procureiq.com` (Clinical department requester)
* **Olivia Officer:** `officer@procureiq.com` (Procurement review officer)
* **Manu Manager:** `approver@procureiq.com` (Hospital budget approver)
* **Alice Admin:** `admin@procureiq.com` (System administrator)

### 3. Run Automated Backend Test Suite (57 Assertions)
```powershell
cd C:\Users\imman\Downloads\procureiq\procureiq\backend
npm test
```

### 4. Execute Cloud ETL & ML Benchmark Locally
```powershell
cd C:\Users\imman\Downloads\procureiq

# 1. Run Serverless ETL Transformation
python cloud/etl/etl_local_runner.py

# 2. Run BigQuery ML Model Benchmark
python cloud/ml/train_and_evaluate_ml.py
```

### 5. Multi-Container Docker Deployment
```powershell
cd C:\Users\imman\Downloads\procureiq
docker compose build
docker compose up -d
```
Access the application at [http://localhost:5173/](http://localhost:5173/).

---

## 📋 Comprehensive Project Documentation

* **[`ACADEMIC_REPORT_CLOUD_FULLSTACK.md`](ACADEMIC_REPORT_CLOUD_FULLSTACK.md):** Complete academic report auditing both Full-Stack (30 Marks) and Cloud Computing (25 Marks) rubrics with IEEE citations.
* **[`cloud/CLOUD_ARCHITECTURE.md`](cloud/CLOUD_ARCHITECTURE.md):** Complete GCP cloud architecture (GCS, Cloud Functions, BigQuery, IAM security, free-tier cost controls).
* **[`cloud/CLOUD_ETL.md`](cloud/CLOUD_ETL.md):** Cloud ETL pipeline specifications, data dictionary (25 fields), and cleaning rules.
* **[`cloud/BIGQUERY_ML_EVALUATION.md`](cloud/BIGQUERY_ML_EVALUATION.md):** BigQuery ML model evaluation with actual measured metrics and confusion matrices.
* **[`cloud/LOOKER_STUDIO_GUIDE.md`](cloud/LOOKER_STUDIO_GUIDE.md):** Step-by-step Looker Studio dashboard setup and BigQuery direct connection guide.

---

## 🔒 Security & Institutional Governance

* **Strict No-Self-Approval Defense:** Institutional fraud prevention physically prevents users from approving purchase orders they created.
* **Mandatory Rejection Reasons:** Reviewers must submit a formal rationale before rejecting clinical purchase requests.
* **Partial Delivery Tracking:** Requisitions stay in `Ordered` state until 100% of physical units are verified and logged in the goods receipt audit trail.
* **Stateless JWT Security:** Bearer token authentication with BCrypt password hashing.

---

## 📄 License
This project is open-source under the MIT License.