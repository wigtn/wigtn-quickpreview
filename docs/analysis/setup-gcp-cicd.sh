#!/bin/bash

# WIGTN GCP CI/CD 자동 설정 스크립트
# 사용법: ./setup-gcp-cicd.sh

set -e

echo "======================================"
echo "WIGTN GCP CI/CD 자동 설정 시작"
echo "======================================"

# 프로젝트 정보 입력
read -p "GCP 프로젝트 ID를 입력하세요: " PROJECT_ID
read -p "GitHub 리포지토리 URL을 입력하세요 (예: https://github.com/user/wigtn): " GITHUB_REPO

# GCP 설정
echo ""
echo "1️⃣  GCP 프로젝트 설정 중..."
gcloud config set project ${PROJECT_ID}

# 필요한 API 활성화
echo ""
echo "2️⃣  필요한 API 활성화 중..."
gcloud services enable \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    secretmanager.googleapis.com \
    containerregistry.googleapis.com

# Artifact Registry 생성
echo ""
echo "3️⃣  Artifact Registry 생성 중..."
gcloud artifacts repositories create wigtn-repo \
    --repository-format=docker \
    --location=asia-southeast1 \
    --description="WIGTN Docker images" \
    --quiet || echo "Repository already exists"

# Secret Manager 설정
echo ""
echo "4️⃣  Secret Manager 설정 중..."

read -sp "Supabase URL을 입력하세요: " SUPABASE_URL
echo ""
read -sp "Supabase Anon Key를 입력하세요: " SUPABASE_ANON_KEY
echo ""
read -sp "Supabase Service Role Key를 입력하세요: " SUPABASE_SERVICE_ROLE_KEY
echo ""
read -sp "OpenAI API Key를 입력하세요: " OPENAI_API_KEY
echo ""

# 시크릿 생성
echo -n "$SUPABASE_URL" | gcloud secrets create SUPABASE_URL --data-file=- --quiet || \
echo -n "$SUPABASE_URL" | gcloud secrets versions add SUPABASE_URL --data-file=-

echo -n "$SUPABASE_ANON_KEY" | gcloud secrets create SUPABASE_ANON_KEY --data-file=- --quiet || \
echo -n "$SUPABASE_ANON_KEY" | gcloud secrets versions add SUPABASE_ANON_KEY --data-file=-

echo -n "$SUPABASE_SERVICE_ROLE_KEY" | gcloud secrets create SUPABASE_SERVICE_ROLE_KEY --data-file=- --quiet || \
echo -n "$SUPABASE_SERVICE_ROLE_KEY" | gcloud secrets versions add SUPABASE_SERVICE_ROLE_KEY --data-file=-

echo -n "$OPENAI_API_KEY" | gcloud secrets create OPENAI_API_KEY --data-file=- --quiet || \
echo -n "$OPENAI_API_KEY" | gcloud secrets versions add OPENAI_API_KEY --data-file=-

# Cloud Build 서비스 계정에 권한 부여
echo ""
echo "5️⃣  Cloud Build 서비스 계정 권한 설정 중..."

CLOUD_BUILD_SA="${PROJECT_ID}@cloudbuild.gserviceaccount.com"

for SECRET in SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY OPENAI_API_KEY
do
    gcloud secrets add-iam-policy-binding ${SECRET} \
        --member=serviceAccount:${CLOUD_BUILD_SA} \
        --role=roles/secretmanager.secretAccessor \
        --quiet || echo "Already has access: ${SECRET}"
done

# Cloud Build 트리거 생성
echo ""
echo "6️⃣  Cloud Build 트리거 생성 중..."

# GitHub 저장소에서 사용자명과 리포지토리명 추출
GITHUB_USER=$(echo ${GITHUB_REPO} | sed 's|.*/||g' | sed 's|\.git$||g')
GITHUB_OWNER=$(echo ${GITHUB_REPO} | sed 's|.*github.com/||g' | sed 's|/.*||g')
GITHUB_REPO_NAME=$(echo ${GITHUB_REPO} | sed 's|.*/||g' | sed 's|\.git$||g')

echo "GitHub Owner: ${GITHUB_OWNER}"
echo "GitHub Repo: ${GITHUB_REPO_NAME}"

# Cloud Console에서 수동으로 생성하도록 안내
echo ""
echo "⚠️  GitHub 연동은 수동으로 진행해주세요."
echo "📌 다음 단계를 실행하세요:"
echo "   1. GCP Console 접속: https://console.cloud.google.com"
echo "   2. Cloud Build → Triggers로 이동"
echo "   3. '새 트리거 만들기' 클릭"
echo "   4. 소스: GitHub 선택"
echo "   5. 리포지토리: ${GITHUB_OWNER}/${GITHUB_REPO_NAME} 선택"
echo "   6. 이벤트: '푸시(브랜치)' 선택"
echo "   7. 브랜치: '^main\$' 입력"
echo "   8. 빌드 구성: 'Cloud Build 구성 파일' 선택"
echo "   9. 위치: '/cloudbuild.yaml' 입력"
echo "   10. '만들기' 클릭"

# Cloud Run 서비스 생성 (선택사항)
echo ""
read -p "Cloud Run 서비스를 지금 생성할까요? (y/n): " CREATE_RUN

if [ "$CREATE_RUN" = "y" ]; then
    echo ""
    echo "7️⃣  Cloud Run 서비스 생성 중..."
    
    # Python AI 서비스
    echo "Python AI 서비스 생성 중..."
    gcloud run create wigtn-ai-service \
        --image=gcr.io/cloudrun/hello \
        --platform=managed \
        --region=asia-southeast1 \
        --allow-unauthenticated \
        --memory=512Mi \
        --cpu=1 \
        --timeout=3600 \
        --set-env-vars="OPENAI_API_KEY=placeholder,SUPABASE_URL=placeholder,SUPABASE_ANON_KEY=placeholder" \
        --quiet || echo "Service might already exist"
    
    # Next.js 서비스
    echo "Next.js 서비스 생성 중..."
    gcloud run create wigtn \
        --image=gcr.io/cloudrun/hello \
        --platform=managed \
        --region=asia-southeast1 \
        --allow-unauthenticated \
        --memory=512Mi \
        --cpu=1 \
        --timeout=3600 \
        --set-env-vars="SUPABASE_URL=placeholder,SUPABASE_ANON_KEY=placeholder,OPENAI_API_KEY=placeholder" \
        --quiet || echo "Service might already exist"
fi

echo ""
echo "======================================"
echo "✅ WIGTN GCP CI/CD 설정 완료!"
echo "======================================"
echo ""
echo "📋 다음 단계:"
echo "1. GitHub에 cloudbuild.yaml을 커밋하세요"
echo "2. Cloud Build 트리거를 생성하세요"
echo "3. main 브랜치에 푸시하면 자동 배포됩니다"
echo ""
echo "🔗 유용한 링크:"
echo "  - Cloud Run: https://console.cloud.google.com/run"
echo "  - Cloud Build: https://console.cloud.google.com/cloud-build"
echo "  - Secret Manager: https://console.cloud.google.com/security/secret-manager"
echo "  - Artifact Registry: https://console.cloud.google.com/artifacts"
