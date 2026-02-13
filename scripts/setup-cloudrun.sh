#!/usr/bin/env bash
# WIGVU Cloud Run Infrastructure Setup
# Run this script once to set up GCP resources for Cloud Run deployment.
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - GCP project created
#
# Usage:
#   export GCP_PROJECT_ID="your-project-id"
#   bash scripts/setup-cloudrun.sh

set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────
REGION="asia-northeast3"  # Seoul
REPO_NAME="wigvu-repo"
GITHUB_REPO="wigtn/wigvu"
SA_NAME="wigvu-github-actions"
WIF_POOL="github-pool"
WIF_PROVIDER="github-provider"

# ─── Validation ──────────────────────────────────────────────────────────────
if [[ -z "${GCP_PROJECT_ID:-}" ]]; then
  echo "ERROR: GCP_PROJECT_ID is not set."
  echo "Usage: GCP_PROJECT_ID=your-project-id bash $0"
  exit 1
fi

echo "=== WIGVU Cloud Run Setup ==="
echo "Project:    ${GCP_PROJECT_ID}"
echo "Region:     ${REGION}"
echo "Repository: ${GITHUB_REPO}"
echo ""

gcloud config set project "${GCP_PROJECT_ID}"

# ─── 1. Enable APIs ─────────────────────────────────────────────────────────
echo ">>> Enabling required APIs..."
gcloud services enable \
  artifactregistry.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  iamcredentials.googleapis.com \
  iam.googleapis.com

# ─── 2. Create Artifact Registry ────────────────────────────────────────────
echo ">>> Creating Artifact Registry repository..."
if gcloud artifacts repositories describe "${REPO_NAME}" --location="${REGION}" &>/dev/null; then
  echo "    Repository '${REPO_NAME}' already exists, skipping."
else
  gcloud artifacts repositories create "${REPO_NAME}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="WIGVU Docker images"
fi

# ─── 3. Create Secret Manager secrets ───────────────────────────────────────
echo ">>> Creating Secret Manager secrets..."
SECRETS=(
  "OPENAI_API_KEY"
  "YOUTUBE_API_KEY"
  "INTERNAL_API_KEY"
  "STT_API_URL"
)

for secret in "${SECRETS[@]}"; do
  if gcloud secrets describe "${secret}" &>/dev/null; then
    echo "    Secret '${secret}' already exists, skipping."
  else
    echo -n "placeholder" | gcloud secrets create "${secret}" \
      --data-file=- \
      --replication-policy=user-managed \
      --locations="${REGION}"
    echo "    Created secret '${secret}' (update with actual value later)"
  fi
done

echo ""
echo "  IMPORTANT: Update secret values with:"
echo "    echo -n 'actual-value' | gcloud secrets versions add SECRET_NAME --data-file=-"

# ─── 4. Create Service Account ──────────────────────────────────────────────
SA_EMAIL="${SA_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

echo ">>> Creating service account: ${SA_EMAIL}"
if gcloud iam service-accounts describe "${SA_EMAIL}" &>/dev/null; then
  echo "    Service account already exists, skipping."
else
  gcloud iam service-accounts create "${SA_NAME}" \
    --display-name="WIGVU GitHub Actions"
fi

# Grant roles
echo ">>> Granting IAM roles..."
ROLES=(
  "roles/run.admin"
  "roles/artifactregistry.writer"
  "roles/secretmanager.secretAccessor"
  "roles/iam.serviceAccountUser"
)

for role in "${ROLES[@]}"; do
  gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${role}" \
    --condition=None \
    --quiet
done

# ─── 5. Workload Identity Federation ────────────────────────────────────────
echo ">>> Setting up Workload Identity Federation..."

# Create pool
if gcloud iam workload-identity-pools describe "${WIF_POOL}" --location=global &>/dev/null; then
  echo "    Pool '${WIF_POOL}' already exists, skipping."
else
  gcloud iam workload-identity-pools create "${WIF_POOL}" \
    --location=global \
    --display-name="GitHub Actions Pool"
fi

# Create provider
POOL_ID=$(gcloud iam workload-identity-pools describe "${WIF_POOL}" --location=global --format="value(name)")

if gcloud iam workload-identity-pools providers describe "${WIF_PROVIDER}" \
  --workload-identity-pool="${WIF_POOL}" --location=global &>/dev/null; then
  echo "    Provider '${WIF_PROVIDER}' already exists, skipping."
else
  gcloud iam workload-identity-pools providers create-oidc "${WIF_PROVIDER}" \
    --location=global \
    --workload-identity-pool="${WIF_POOL}" \
    --display-name="GitHub Provider" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --attribute-condition="assertion.repository=='${GITHUB_REPO}'"
fi

# Bind service account to repository
echo ">>> Binding service account to repository..."
gcloud iam service-accounts add-iam-policy-binding "${SA_EMAIL}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${POOL_ID}/attribute.repository/${GITHUB_REPO}" \
  --quiet

# ─── 6. Output ───────────────────────────────────────────────────────────────
PROVIDER_FULL=$(gcloud iam workload-identity-pools providers describe "${WIF_PROVIDER}" \
  --workload-identity-pool="${WIF_POOL}" --location=global --format="value(name)")

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Add these as GitHub Repository Secrets:"
echo "  GCP_PROJECT_ID      = ${GCP_PROJECT_ID}"
echo "  WIF_PROVIDER        = ${PROVIDER_FULL}"
echo "  WIF_SERVICE_ACCOUNT = ${SA_EMAIL}"
echo ""
echo "Then update secret values:"
for secret in "${SECRETS[@]}"; do
  echo "  echo -n 'value' | gcloud secrets versions add ${secret} --data-file=-"
done
echo ""
echo "Docker registry: ${REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REPO_NAME}/"
