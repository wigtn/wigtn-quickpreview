# QuickPreview AI

AI/ML 백엔드 서비스 (예정)

## 기술 스택 (예정)

- **Framework**: FastAPI
- **STT**: WhisperX / Whisper
- **ML**: PyTorch, Transformers
- **Task Queue**: Celery + Redis

## 주요 기능 (예정)

- Speech-to-Text (WhisperX)
- 언어 감지
- 자막 타임스탬프 정렬
- 음성 품질 분석

## 개발 시작

```bash
# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 개발 서버
uvicorn main:app --reload --port 5000
```

## API 엔드포인트 (예정)

| Method | Path | Description |
|--------|------|-------------|
| POST | /transcribe | 오디오 STT 변환 |
| POST | /detect-language | 언어 감지 |
| GET | /health | 헬스체크 |

## 환경변수

```env
WHISPER_MODEL=large-v3
DEVICE=cuda  # or cpu
REDIS_URL=redis://localhost:6379
```

## GPU 지원

NVIDIA GPU 사용 시 docker-compose.yml에서 GPU 설정 활성화:

```yaml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1
          capabilities: [gpu]
```
