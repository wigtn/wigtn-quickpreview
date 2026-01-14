# QuickPreview API

백엔드 API 서비스 (예정)

## 기술 스택 (예정)

- **Framework**: NestJS
- **Database**: PostgreSQL + Prisma
- **Cache**: Redis
- **Auth**: JWT

## 주요 기능 (예정)

- 사용자 인증/인가
- 분석 결과 캐싱
- 사용량 추적
- Rate Limiting

## 개발 시작

```bash
# 의존성 설치
npm install

# 개발 서버
npm run start:dev

# 빌드
npm run build
```

## API 엔드포인트 (예정)

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/login | 로그인 |
| POST | /auth/register | 회원가입 |
| GET | /analysis/:videoId | 분석 결과 조회 |
| POST | /analysis | 영상 분석 요청 |

## 환경변수

```env
DATABASE_URL=postgresql://user:password@localhost:5432/quickpreview
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
```
