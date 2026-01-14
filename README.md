# QuickPreview

YouTube 영상의 자막을 추출하고 한국어로 번역하여 실시간으로 동기화된 스크립트를 제공하는 서비스입니다.

## 프로젝트 구조

```
quickpreview/
├── apps/
│   ├── web/              # Frontend (Next.js 16)
│   ├── api/              # Backend API (예정)
│   └── ai/               # AI Backend (예정)
├── docs/
│   └── prd/              # PRD 문서
├── docker-compose.yml    # 서비스 오케스트레이션
└── .env.example          # 환경변수 예시
```

## 주요 기능

- **자막 추출**: YouTube 자막 또는 STT(WhisperX)로 추출
- **자동 번역**: OpenAI API를 통한 영어→한국어 번역
- **실시간 동기화**: 영상 재생 시간과 자막 동기화
- **스크립트 패널**: 원본/번역 토글, 자동 스크롤

## 시작하기

### 로컬 개발

```bash
# 1. 환경변수 설정
cp .env.example .env
# .env 파일에 API 키 입력

# 2. 의존성 설치
cd apps/web
npm install

# 3. 개발 서버 실행
npm run dev
```

### Docker 배포

```bash
# 1. 환경변수 설정
cp .env.example .env

# 2. 빌드 및 실행
docker-compose up -d

# 3. 로그 확인
docker-compose logs -f web
```

## 환경변수

| 변수 | 설명 | 필수 |
|------|------|------|
| `YOUTUBE_API_KEY` | YouTube Data API v3 키 | O |
| `OPENAI_API_KEY` | OpenAI API 키 (번역/분석) | O |
| `WHISPERX_API_URL` | WhisperX API 주소 (STT) | △ |

## 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript 5, Tailwind CSS 4
- **API**: OpenAI GPT-4o-mini, YouTube Data API v3
- **STT**: WhisperX API
- **배포**: Docker, Docker Compose

## 문서

- [PRD 문서](./docs/prd/quickpreview-service.md)

## 라이선스

MIT License
