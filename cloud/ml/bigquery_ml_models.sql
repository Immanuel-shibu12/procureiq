-- ========================================================================
-- MediProcureIQ: BigQuery ML Model Definition & Evaluation Pipeline
-- Managed Cloud Machine Learning on Google Cloud Platform (GCP)
-- ========================================================================

-- 1. Create Analytics Dataset in BigQuery
CREATE SCHEMA IF NOT EXISTS `mediprocureiq_analytics`
OPTIONS(
  location = 'us-central1',
  description = 'Hospital Procurement and Supplier Risk Intelligence Analytics'
);

-- 2. Create or Replace Clean Procurement Table from Cloud Storage
LOAD DATA OVERWRITE `mediprocureiq_analytics.hospital_procurement_clean`
FROM FILES (
  format = 'CSV',
  uris = ['gs://mediprocureiq-raw-data/clean/hospital_procurement_clean.csv'],
  skip_leading_rows = 1
);

-- ========================================================================
-- MODEL 1: Logistic Regression Classifier (Linear Baseline)
-- Predicts whether an incoming medical purchase order will face delivery delays
-- ========================================================================
CREATE OR REPLACE MODEL `mediprocureiq_analytics.supplier_delay_logistic_reg`
OPTIONS (
  model_type = 'LOGISTIC_REG',
  input_label_cols = ['delayed_delivery'],
  data_split_method = 'RANDOM',
  data_split_eval_fraction = 0.2,
  auto_class_weights = TRUE,
  max_iterations = 25
) AS
SELECT
  supplier_rating,
  historical_ontime_pct,
  clinical_criticality,
  cold_chain_required,
  sterility_certified,
  order_quantity,
  unit_price_inr,
  promised_lead_days,
  item_category,
  delayed_delivery
FROM
  `mediprocureiq_analytics.hospital_procurement_clean`;

-- ========================================================================
-- MODEL 2: Boosted Tree Classifier (Gradient Boosted Decision Trees / XGBoost)
-- Captures non-linear cold-chain and clinical volume risk interactions
-- ========================================================================
CREATE OR REPLACE MODEL `mediprocureiq_analytics.supplier_delay_boosted_tree`
OPTIONS (
  model_type = 'BOOSTED_TREE_CLASSIFIER',
  input_label_cols = ['delayed_delivery'],
  data_split_method = 'RANDOM',
  data_split_eval_fraction = 0.2,
  max_iterations = 35,
  learn_rate = 0.15,
  l2_reg = 0.1,
  tree_method = 'HIST'
) AS
SELECT
  supplier_rating,
  historical_ontime_pct,
  clinical_criticality,
  cold_chain_required,
  sterility_certified,
  order_quantity,
  unit_price_inr,
  promised_lead_days,
  item_category,
  delayed_delivery
FROM
  `mediprocureiq_analytics.hospital_procurement_clean`;

-- ========================================================================
-- MODEL 3: Defect Risk Classifier (Quality & Sterility Failure Prediction)
-- Identifies batches requiring strict quarantine / biomedical pre-inspection
-- ========================================================================
CREATE OR REPLACE MODEL `mediprocureiq_analytics.defect_risk_boosted_tree`
OPTIONS (
  model_type = 'BOOSTED_TREE_CLASSIFIER',
  input_label_cols = ['defect_flag'],
  data_split_method = 'RANDOM',
  data_split_eval_fraction = 0.2,
  auto_class_weights = TRUE,
  max_iterations = 30
) AS
SELECT
  supplier_rating,
  historical_ontime_pct,
  clinical_criticality,
  sterility_certified,
  order_quantity,
  unit_price_inr,
  item_category,
  defect_flag
FROM
  `mediprocureiq_analytics.hospital_procurement_clean`;

-- ========================================================================
-- EVALUATION QUERIES: Compare Accuracy, Precision, Recall, F1, ROC-AUC
-- ========================================================================

-- A. Evaluate Logistic Regression Performance
SELECT
  'Logistic Regression (Baseline)' AS model_name,
  precision,
  recall,
  accuracy,
  f1_score,
  log_loss,
  roc_auc
FROM
  ML.EVALUATE(MODEL `mediprocureiq_analytics.supplier_delay_logistic_reg`);

-- B. Evaluate Boosted Tree Performance
SELECT
  'Boosted Tree (Gradient Boosted)' AS model_name,
  precision,
  recall,
  accuracy,
  f1_score,
  log_loss,
  roc_auc
FROM
  ML.EVALUATE(MODEL `mediprocureiq_analytics.supplier_delay_boosted_tree`);

-- C. Evaluate Defect Risk Model Performance
SELECT
  'Defect Risk Classifier' AS model_name,
  precision,
  recall,
  accuracy,
  f1_score,
  log_loss,
  roc_auc
FROM
  ML.EVALUATE(MODEL `mediprocureiq_analytics.defect_risk_boosted_tree`);

-- D. Inspect Confusion Matrix for Boosted Tree
SELECT
  *
FROM
  ML.CONFUSION_MATRIX(MODEL `mediprocureiq_analytics.supplier_delay_boosted_tree`);

-- E. Feature Importance Ranking (What drives hospital supplier risk?)
SELECT
  *
FROM
  ML.FEATURE_IMPORTANCE(MODEL `mediprocureiq_analytics.supplier_delay_boosted_tree`)
ORDER BY
  importance_weight DESC;

-- ========================================================================
-- BATCH INFERENCE QUERY: Score Active Hospital Requisitions
-- ========================================================================
SELECT
  order_id,
  item_name,
  supplier_name,
  predicted_delayed_delivery,
  predicted_delayed_delivery_probs[OFFSET(0)].prob AS on_time_probability,
  predicted_delayed_delivery_probs[OFFSET(1)].prob AS delay_risk_probability
FROM
  ML.PREDICT(
    MODEL `mediprocureiq_analytics.supplier_delay_boosted_tree`,
    (SELECT * FROM `mediprocureiq_analytics.hospital_procurement_clean` LIMIT 50)
  );
