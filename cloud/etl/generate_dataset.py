"""
Hospital Procurement & Supplier Risk Dataset Generator (MediProcureIQ)
Domain: Health & Healthcare Supply Chain
Generates a realistic, clearly-labeled synthetic dataset reflecting hospital purchase
orders, supplier delivery performance, cold-chain compliance, and quality defect rates.
"""

import os
import random
import pandas as pd
import numpy as np

# Set deterministic seed for reproducibility
np.random.seed(42)
random.seed(42)

DEPARTMENTS = ['Cardiology ICU', 'Emergency Care', 'Central Surgery', 'Oncology Care', 'Pediatrics', 'Radiology & Imaging', 'Clinical Pathology']

CATEGORIES = {
    'ICU Equipment': [
        ('ICU Invasive Ventilator Tubing', 3200, 14),
        ('Multi-parameter Patient Monitor Probes', 8500, 10),
        ('Syringe Infusion Pump Cartridges', 1200, 7),
        ('Defibrillator Electrode Pads', 2400, 5),
        ('Dialysis Machine Filter Units', 14500, 12)
    ],
    'Pharmaceuticals': [
        ('Propofol ICU Anaesthetic Ampoules', 850, 4),
        ('Broad-Spectrum Ceftriaxone Antibiotics', 420, 5),
        ('Corticosteroid Injections (Dexamethasone)', 180, 3),
        ('Heparin Anticoagulant Vials', 650, 4),
        ('Insulin Glargine Cold-Chain Cartridges', 1150, 3)
    ],
    'Surgical Supplies': [
        ('Sterile Titanium Suture Clips', 4500, 8),
        ('Disposable Laparoscopic Trocar Sets', 6800, 10),
        ('Hemostatic Gauze & Gelatin Sponges', 950, 6),
        ('Electrosurgical Cautery Pencils', 1250, 7),
        ('Surgical Blade Dispenser Packs', 780, 5)
    ],
    'PPE & Sanitization': [
        ('NIOSH N95 Hospital Surgical Respirators', 45, 3),
        ('Chemotherapy-Grade Nitrile Gloves', 380, 4),
        ('Sterile Surgical Fluid-Resistant Gowns', 620, 5),
        ('Hospital-Grade Chlorhexidine Sanitizer', 290, 4),
        ('Protective Anti-Fog Face Shields', 110, 3)
    ],
    'Diagnostic Devices': [
        ('Rapid Blood Gas Cartridges', 3400, 6),
        ('Automated Blood Culture Vials', 1850, 7),
        ('Digital Infrared Thermometer Sensors', 1450, 8),
        ('Portable Glucometer Test Strips', 820, 4),
        ('Ultrasound Acoustic Coupling Gel Bulk', 550, 5)
    ]
}

SUPPLIERS = [
    {'name': 'BioMed Diagnostics [SAMPLE]', 'base_on_time': 0.96, 'base_quality': 4.8, 'delay_bias': 0.04, 'defect_bias': 0.01},
    {'name': 'Apex Pharma Care [SAMPLE]', 'base_on_time': 0.93, 'base_quality': 4.6, 'delay_bias': 0.07, 'defect_bias': 0.02},
    {'name': 'MedTech ICU Systems [SAMPLE]', 'base_on_time': 0.95, 'base_quality': 4.7, 'delay_bias': 0.05, 'defect_bias': 0.02},
    {'name': 'SurgiClean Instruments [SAMPLE]', 'base_on_time': 0.81, 'base_quality': 3.7, 'delay_bias': 0.22, 'defect_bias': 0.09},
    {'name': 'Orbit Medical Supplies [SAMPLE]', 'base_on_time': 0.88, 'base_quality': 4.1, 'delay_bias': 0.12, 'defect_bias': 0.04},
    {'name': 'Zenith Health Logistics [SAMPLE]', 'base_on_time': 0.69, 'base_quality': 2.8, 'delay_bias': 0.38, 'defect_bias': 0.16},
    {'name': 'QuickCare Pharma Dist [SAMPLE]', 'base_on_time': 0.84, 'base_quality': 3.9, 'delay_bias': 0.18, 'defect_bias': 0.05},
    {'name': 'Global Sterile Solutions [SAMPLE]', 'base_on_time': 0.91, 'base_quality': 4.4, 'delay_bias': 0.09, 'defect_bias': 0.03}
]

def generate_dataset(n_samples=1200):
    rows = []
    start_date = pd.Timestamp('2025-01-01')

    for i in range(1, n_samples + 1):
        order_id = f"PO-MED-{1000 + i}"
        dept = random.choice(DEPARTMENTS)
        cat = random.choice(list(CATEGORIES.keys()))
        item_tuple = random.choice(CATEGORIES[cat])
        item_name, base_price, base_lead = item_tuple

        supplier = random.choice(SUPPLIERS)
        supplier_name = supplier['name']
        supplier_rating = round(np.clip(np.random.normal(supplier['base_quality'], 0.25), 1.0, 5.0), 2)
        historical_ontime = round(np.clip(np.random.normal(supplier['base_on_time'] * 100, 4.0), 45.0, 100.0), 1)

        # Quantity and pricing
        qty = int(np.random.choice([10, 25, 50, 100, 250, 500, 1000], p=[0.2, 0.25, 0.25, 0.15, 0.08, 0.05, 0.02]))
        # Small price variance
        unit_price = round(base_price * np.random.uniform(0.92, 1.08), 2)
        total_spend = round(qty * unit_price, 2)

        # Domain flags
        cold_chain = 1 if cat == 'Pharmaceuticals' and ('Insulin' in item_name or random.random() < 0.3) else 0
        sterility_cert = 1 if cat in ['Surgical Supplies', 'PPE & Sanitization'] else (1 if random.random() < 0.5 else 0)

        # Lead time calculation
        lead_days = int(base_lead + np.random.choice([-1, 0, 1, 2]))
        order_date = start_date + pd.Timedelta(days=int(np.random.uniform(0, 420)))
        promised_delivery = order_date + pd.Timedelta(days=lead_days)

        # Determine delay probability based on supplier delay bias and cold chain challenges
        p_delay = supplier['delay_bias']
        if cold_chain:
            p_delay += 0.08
        if qty >= 500:
            p_delay += 0.06
        if historical_ontime < 80.0:
            p_delay += 0.15
        p_delay = min(max(p_delay, 0.02), 0.90)

        delayed = 1 if random.random() < p_delay else 0
        if delayed:
            delay_days = int(np.random.exponential(scale=4.5) + 1)
        else:
            delay_days = int(np.random.choice([0, -1, -2], p=[0.7, 0.2, 0.1]))

        actual_delivery = promised_delivery + pd.Timedelta(days=delay_days)
        actual_lead_days = max(1, (actual_delivery - order_date).days)

        # Determine defect probability
        p_defect = supplier['defect_bias']
        if sterility_cert == 0 and cat == 'Surgical Supplies':
            p_defect += 0.18
        if supplier_rating < 3.2:
            p_defect += 0.12
        p_defect = min(max(p_defect, 0.01), 0.75)
        defect_flag = 1 if random.random() < p_defect else 0

        # Risk Classification (Low, Medium, High)
        if delayed == 1 and defect_flag == 1:
            risk_label = 'High'
        elif delayed == 1 or defect_flag == 1 or supplier_rating < 3.5 or historical_ontime < 80.0:
            risk_label = 'Medium'
        else:
            risk_label = 'Low'

        rows.append({
            'order_id': order_id,
            'order_date': order_date.strftime('%Y-%m-%d'),
            'hospital_department': dept,
            'item_category': cat,
            'item_name': item_name,
            'supplier_name': supplier_name,
            'supplier_rating': supplier_rating,
            'historical_ontime_pct': historical_ontime,
            'cold_chain_required': cold_chain,
            'sterility_certified': sterility_cert,
            'order_quantity': qty,
            'unit_price_inr': unit_price,
            'total_spend_inr': total_spend,
            'promised_lead_days': lead_days,
            'actual_lead_days': actual_lead_days,
            'promised_delivery_date': promised_delivery.strftime('%Y-%m-%d'),
            'actual_delivery_date': actual_delivery.strftime('%Y-%m-%d'),
            'delayed_delivery': delayed,
            'defect_flag': defect_flag,
            'risk_label': risk_label,
            'data_source': 'Hospital ERP Logistics Core (Synthetic Labeled Benchmark)'
        })

    df = pd.DataFrame(rows)
    return df

if __name__ == '__main__':
    out_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(out_dir, exist_ok=True)
    df = generate_dataset(1200)
    out_file = os.path.join(out_dir, 'hospital_procurement_raw.csv')
    df.to_csv(out_file, index=False)
    print(f"Dataset generated successfully: {out_file}")
    print(f"Total Rows: {len(df)}, Columns: {len(df.columns)}")
    print(f"Delayed Deliveries: {df['delayed_delivery'].sum()} ({df['delayed_delivery'].mean()*100:.1f}%)")
    print(f"Defect Occurrences: {df['defect_flag'].sum()} ({df['defect_flag'].mean()*100:.1f}%)")
    print("Risk breakdown:")
    print(df['risk_label'].value_counts())
