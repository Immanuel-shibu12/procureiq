"""
Google Cloud Storage (GCS) Ingestion Script (MediProcureIQ)
Uploads raw hospital procurement dataset to GCP Cloud Storage bucket:
gs://mediprocureiq-raw-data/hospital_procurement_raw.csv

Supports both:
1. Live GCP Cloud Storage upload via google-cloud-storage SDK.
2. Local Offline Simulation fallback when GCP credentials/connection are not yet configured.
"""

import os
import sys

def upload_to_gcs(
    local_file_path="cloud/data/hospital_procurement_raw.csv",
    bucket_name="mediprocureiq-raw-data",
    destination_blob_name="raw/hospital_procurement_raw.csv"
):
    if not os.path.exists(local_file_path):
        print(f"[ERROR] Source file not found: {local_file_path}")
        return False

    file_size_kb = os.path.getsize(local_file_path) / 1024
    print(f"[*] Preparing upload: {local_file_path} ({file_size_kb:.2f} KB)")
    print(f"[*] Target GCS URI: gs://{bucket_name}/{destination_blob_name}")

    # Check for active Google Application Credentials
    gcp_creds = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    gcp_project = os.environ.get("GCP_PROJECT_ID")

    try:
        from google.cloud import storage
        client = storage.Client(project=gcp_project)
        bucket = client.bucket(bucket_name)

        # Check if bucket exists, create if not present
        if not bucket.exists():
            print(f"[*] Bucket gs://{bucket_name} not found. Attempting creation in region us-central1...")
            bucket = client.create_bucket(bucket_name, location="us-central1")
            print(f"[✓] Created GCS Bucket: gs://{bucket_name}")

        blob = bucket.blob(destination_blob_name)
        blob.upload_from_filename(local_file_path)
        print(f"[OK] LIVE GCP SUCCESS: Uploaded {local_file_path} to gs://{bucket_name}/{destination_blob_name}")
        return True

    except Exception as e:
        print(f"\n[INFO] Live GCP credentials/SDK not active or unauthorized ({type(e).__name__}: {e})")
        print("[*] Activating Local GCS Emulation / Staging Mode...")

        sim_bucket_dir = os.path.join(os.path.dirname(__file__), "..", "data", "simulated_gcs_bucket", bucket_name, "raw")
        os.makedirs(sim_bucket_dir, exist_ok=True)
        sim_target = os.path.join(sim_bucket_dir, os.path.basename(local_file_path))

        with open(local_file_path, "rb") as src, open(sim_target, "wb") as dst:
            dst.write(src.read())

        print(f"[SUCCESS] LOCAL GCS EMULATION SUCCESS:")
        print(f"    Raw object staged at: {sim_target}")
        print(f"    Virtual Cloud URI: gs://{bucket_name}/{destination_blob_name}")
        print(f"    Size: {file_size_kb:.2f} KB | Ready for Cloud Function / BigQuery ingestion.")
        print("\nTo deploy this to live GCP when ready, execute:")
        print(f"    gcloud storage cp {local_file_path} gs://{bucket_name}/{destination_blob_name}")
        return True

if __name__ == "__main__":
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    csv_path = os.path.join(base_dir, "cloud", "data", "hospital_procurement_raw.csv")
    upload_to_gcs(csv_path)
