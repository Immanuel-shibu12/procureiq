# MediProcureIQ: Google Looker Studio Dashboard Guide
**Cloud Platform:** Google Cloud Platform (GCP)  
**Data Warehouse:** Google BigQuery  
**Table Source:** `mediprocureiq_analytics.hospital_procurement_clean`  
**Target Domain:** Health & Healthcare Supply Chain Intelligence  

---

## 1. Executive Dashboard Architecture

The MediProcureIQ executive dashboard bridges raw BigQuery procurement tables with dynamic business intelligence for hospital procurement officers, clinical department heads, and hospital chief financial officers (CFOs).

```
[ Google Cloud Storage ] 
        │ (Automated GCS Finalize Event)
        ▼
[ Cloud Functions ETL ]
        │ (Cleansed & Enriched Streaming Load)
        ▼
[ Google BigQuery ] ───( Direct Live SQL Connector )───► [ Google Looker Studio ]
```

---

## 2. BigQuery Data Source Connection (Step-by-Step)

1. Navigate to **[Looker Studio](https://lookerstudio.google.com/)** and sign in with your Google Cloud account.
2. Click **Create** &rarr; **Data Source**.
3. Under Google Connectors, select **BigQuery**.
4. Authorize Looker Studio to access your GCP Project.
5. In the navigation tree:
   - **Project:** Select your GCP Project ID (e.g., `mediprocureiq-prod`)
   - **Dataset:** Select `mediprocureiq_analytics`
   - **Table:** Select `hospital_procurement_clean`
6. Click **Connect** in the top-right corner.

---

## 3. Field Configuration & Semantic Mappings

Verify that Looker Studio maps the schema correctly:

| Field Name | Type | Looker Studio Aggregation | Semantic Category |
| :--- | :--- | :--- | :--- |
| `order_id` | Text | None | Identifier |
| `order_date` | Date (YYYYMMDD) | None | Temporal |
| `hospital_department` | Text | None | Clinical Dimension |
| `item_category` | Text | None | Product Category |
| `item_name` | Text | None | Item Name |
| `supplier_name` | Text | None | Vendor Dimension |
| `risk_label` | Text | None | Categorical Risk (Low/Med/High) |
| `total_spend_inr` | Currency (INR) | `SUM` | Financial Metric |
| `unit_price_inr` | Currency (INR) | `AVERAGE` | Price Metric |
| `order_quantity` | Number | `SUM` | Volume Metric |
| `delayed_delivery` | Number | `SUM` | Reliability Counter |
| `defect_flag` | Number | `SUM` | Quality Failure Counter |
| `cold_chain_risk` | Number | `SUM` | Temperature Breach Counter |
| `composite_risk_score`| Number | `AVERAGE` | Derived Composite Risk Index |

---

## 4. Dashboard Canvas Layout & Visual Components

### Page 1: Hospital Executive Summary (Scorecards & Filters)
1. **Interactive Dropdown Controls (Top Bar):**
   - **Filter 1:** `hospital_department` (e.g., Cardiology ICU, Emergency Care, Central Surgery, Oncology)
   - **Filter 2:** `item_category` (e.g., ICU Equipment, Pharmaceuticals, Surgical Supplies)
   - **Filter 3:** `risk_label` (Low, Medium, High)
   - **Filter 4:** Date Range Picker (`order_date`)
2. **KPI Scorecard Tiles:**
   - **Total Procurement Spend:** `SUM(total_spend_inr)` formatted in Crores (₹).
   - **Total Orders Tracked:** `COUNT(order_id)`.
   - **Overall Delayed Delivery Rate:** `SUM(delayed_delivery) / COUNT(order_id)` displayed as `%`.
   - **Critical Cold-Chain Hazard Incidents:** `SUM(cold_chain_risk)`.
   - **Mean Supplier Composite Risk Score:** `AVG(composite_risk_score)` with conditional coloring:
     - Green: $< 25$
     - Amber: $25 - 45$
     - Red: $> 45$

### Page 2: Clinical Spend & Vendor Reliability Analysis
1. **Departmental Spend Breakdown (Treemap / Bar Chart):**
   - **Dimension:** `hospital_department`
   - **Metric:** `SUM(total_spend_inr)`
   - **Breakdown:** `item_category`
2. **Supplier Performance Matrix (Scatter Plot):**
   - **X-Axis:** `AVG(historical_ontime_pct)` (On-time fulfillment track record)
   - **Y-Axis:** `AVG(supplier_rating)` (Quality rating out of 5.0)
   - **Bubble Size:** `SUM(total_spend_inr)`
   - **Color:** `risk_label` (Green = Low, Yellow = Medium, Red = High)
3. **Monthly Delay Trend (Time Series):**
   - **Dimension:** `order_date` (Grouped by Month)
   - **Metric 1:** `SUM(delayed_delivery)`
   - **Metric 2:** `SUM(defect_flag)`

---

## 5. Calculated Fields in Looker Studio

To replicate MediProcureIQ's dynamic calculations inside Looker Studio, add the following Calculated Fields:

### A. Delivery Compliance Percentage
```sql
(COUNT(order_id) - SUM(delayed_delivery)) / COUNT(order_id) * 100
```

### B. Clinical Criticality Label
```sql
CASE
  WHEN clinical_criticality = 3 THEN "Critical (ICU / Operating Theater)"
  WHEN clinical_criticality = 2 THEN "High (Pharmaceutical / Diagnostics)"
  ELSE "Standard (Barrier PPE / Sanitization)"
END
```

### C. Temperature Compliance Warning
```sql
CASE
  WHEN cold_chain_required = 1 AND delayed_delivery = 1 THEN "Critical Cold-Chain Breach"
  WHEN cold_chain_required = 1 AND delayed_delivery = 0 THEN "Cold-Chain Maintained"
  ELSE "Ambient Standard"
END
```

---

## 6. Embedding Looker Studio into MediProcureIQ

Once your dashboard is saved on Looker Studio:
1. In Looker Studio, click **File** &rarr; **Embed report**.
2. Check **Enable embedding** and select **Embed Code**.
3. Copy the secure iframe URL (e.g., `https://lookerstudio.google.com/embed/reporting/...`).
4. In MediProcureIQ, paste the URL into your environment variable:
   ```env
   LOOKER_STUDIO_EMBED_URL="https://lookerstudio.google.com/embed/reporting/YOUR_REPORT_ID"
   ```
5. Navigate to the **Cloud ML & Analytics** tab in the MediProcureIQ web app to view the live responsive embedded visualization.
