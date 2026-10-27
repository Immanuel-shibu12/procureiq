# MediProcureIQ: Dataset Source, Provenance & Licensing Documentation

---

## 1. Dataset Overview & Provenance

* **Dataset Identifier:** `mediprocureiq-hospital-procurement-v1.0`
* **Dataset Domain:** Healthcare & Clinical Supply Chain Governance
* **Volume:** 1,200 Procurement Transactions
* **Raw Schema:** 21 Columns ([`cloud/data/hospital_procurement_raw.csv`](hospital_procurement_raw.csv))
* **Cleaned Schema:** 25 Columns ([`cloud/data/hospital_procurement_clean.csv`](hospital_procurement_clean.csv))
* **Temporal Coverage:** Multi-quarter hospital purchasing cycles (January 2025 to March 2026)
* **Target Domain:** Hospital Procurement, Clinical Criticality Risk, and Delivery Delay Prediction

---

## 2. Dataset Source & Derivation Methodology

This benchmark dataset was formulated and calibrated utilizing established open healthcare supply chain frameworks:
1. **World Health Organization (WHO):** Model List of Essential Medicines & Technical Specifications for Medical Devices.
2. **Indian Public Health Standards (IPHS):** Guidelines for District Hospitals and Medical Colleges Procurement Protocols.
3. **Clinical Operational Taxonomy:** Calibrated using real-world hospital procurement metrics:
   * **Item Categories:** ICU Equipment, Pharmaceuticals, Surgical Supplies, Diagnostic Devices, PPE & Sanitization.
   * **Hospital Departments:** Intensive Care Unit (ICU), Cardiology, Oncology, General Surgery, Emergency Medicine, Diagnostics & Pathology.
   * **Cold-Chain & Sterility Parameters:** Mapped to regulatory storage requirements for biopharmaceuticals and sterile surgical implants.

---

## 3. License & Terms of Use

* **License Name:** Creative Commons Attribution 4.0 International (**CC BY 4.0**)  
* **SPDX License Identifier:** `CC-BY-4.0`  
* **License URL:** [https://creativecommons.org/licenses/by/4.0/](https://creativecommons.org/licenses/by/4.0/)

### Grant of Rights:
You are free to:
* **Share:** Copy and redistribute the material in any medium or format.
* **Adapt:** Remix, transform, and build upon the material for academic, research, commercial, and operational purposes.

### Attribution Notice:
```text
MediProcureIQ Hospital Procurement & Clinical Supply Chain Dataset (1,200 Records)
Author: Immanuel Shibu Chandy (2026)
Project: MediProcureIQ — Cloud Hospital Procurement & Risk Intelligence Platform
License: Creative Commons Attribution 4.0 International (CC BY 4.0)
Repository: https://github.com/Immanuel-shibu12/procureiq
```

---

## 4. Analytical Schema & Feature Dictionary

| Column Name | Data Type | Range / Domain | Clinical & Operational Significance |
| :--- | :--- | :--- | :--- |
| `order_id` | STRING | `PO-MED-1001` to `PO-MED-2200` | Unique hospital procurement order identifier |
| `order_date` | DATE | `2025-01-01` to `2026-03-01` | Date purchase requisition was officially issued |
| `hospital_department`| STRING | ICU, Surgery, Oncology, etc. | Clinical ward requisitioning goods |
| `item_category` | STRING | 5 Healthcare categories | Supply classification domain |
| `item_name` | STRING | Medical equipment/drug | Clinical item nomenclature |
| `supplier_name` | STRING | 12 Medical vendors | Commercial supplier entity |
| `supplier_rating` | FLOAT | `1.0` to `5.0` | Hospital vendor evaluation score |
| `historical_ontime_pct`| FLOAT | `45.0%` to `100.0%` | Historical delivery reliability rate |
| `cold_chain_required` | INTEGER | `0` (Ambient), `1` (Cold) | Strict temperature regulation indicator |
| `sterility_certified` | INTEGER | `0` (Standard), `1` (Sterile)| Autoclave sterilization certification |
| `order_quantity` | INTEGER | `10` to `1,000` units | Number of units ordered |
| `unit_price_inr` | FLOAT | `₹45.00` to `₹145,000.00` | Unit price in Indian Rupees |
| `total_spend_inr` | FLOAT | Derived ($Qty \times Unit Price$)| Total financial commitment |
| `promised_lead_days` | INTEGER | `3` to `16` days | Contracted vendor fulfillment SLA |
| `actual_lead_days` | INTEGER | `1` to `25` days | Realized delivery turnaround time |
| `delayed_delivery` | INTEGER | `0` (On-Time), `1` (Delayed)| **Target Feature:** Delivery deadline overrun |
| `defect_flag` | INTEGER | `0` (Pass), `1` (Recall) | Incoming clinical batch quality failure |
| `lead_time_variance_days`| INTEGER | Negative (Early), Positive (Late)| Engineered delivery overrun metric ($\Delta$) |
| `criticality_tier` | INTEGER | `1` (Standard) to `3` (Critical)| ICU/Surgical clinical risk priority |
| `cold_chain_risk` | INTEGER | `0` (Safe), `1` (Compromised)| Temperature stability violation flag |
| `composite_risk_score` | FLOAT | `0.0` to `100.0` | Multi-attribute vendor health index |

---

## 5. Ethical & Privacy Considerations
* **No Protected Health Information (PHI):** The dataset pertains exclusively to institutional B2B procurement transactions and hospital logistics. No patient identifiers, medical histories, or HIPAA/GDPR sensitive records are included.
* **Academic Integrity:** All metrics are reproducible and verifiable using `cloud/etl/etl_local_runner.py`.
