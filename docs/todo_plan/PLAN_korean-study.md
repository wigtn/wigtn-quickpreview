# Task Plan: Korean Study App

> **Generated from**: docs/prd/PRD_korean-study.md
> **Created**: 2026-02-13
> **Status**: pending

## Execution Config

| Option | Value | Description |
|--------|-------|-------------|
| `auto_commit` | true | 완료 시 자동 커밋 |
| `commit_per_phase` | false | Phase별 중간 커밋 여부 |
| `quality_gate` | true | /auto-commit 품질 검사 |

## Phases

### Phase 1: 폴더 구조 리팩토링

기존 플랫 구조를 features/ 기반으로 정리

- [ ] `shared/` 디렉토리 생성, 공통 컴포넌트 이동 (ui/, navigation, loading-state, error-display, etc.)
- [ ] `features/video/` 생성, 기존 영상 분석 코드 이동 (script-panel, analysis-view, hooks, services)
- [ ] import 경로 전체 업데이트
- [ ] 빌드 검증 (npm run build)

### Phase 2: Korean Study 백엔드 (AI 서비스)

FastAPI에 한국어 기사 분석 엔드포인트 추가

- [ ] `models/study_schemas.py` — 요청/응답 Pydantic 스키마
- [ ] `services/study/article_analyzer.py` — 번역 + 표현 추출 LLM 로직
- [ ] `api/study/analyze.py` — 분석 라우터
- [ ] `api/router.py` 업데이트 (study 라우터 등록)
- [ ] AI 빌드 검증

### Phase 3: Korean Study 프론트엔드 (Core)

기사 목록, 읽기 뷰, 학습 모드 구현

- [ ] `features/study/types/study.ts` — 타입 정의
- [ ] `features/study/lib/articles-data.ts` — 정적 기사 데이터 (10-20개)
- [ ] `features/study/components/language-selector.tsx` — 모국어 선택
- [ ] `features/study/components/article-card.tsx` — 기사 카드
- [ ] `features/study/components/article-list.tsx` — 기사 목록
- [ ] `features/study/components/article-read-view.tsx` — 원문 읽기 뷰
- [ ] `features/study/components/expression-bar.tsx` — 표현 바
- [ ] `features/study/components/study-view.tsx` — 학습 모드 뷰 (라인 바이 라인)
- [ ] `features/study/lib/study-service.ts` — AI 서비스 호출
- [ ] `features/study/hooks/use-article-study.ts` — SSE 스트리밍 훅

### Phase 4: BFF + 페이지 통합

Next.js API Routes 및 페이지 연결

- [ ] `app/api/study/analyze/route.ts` — SSE 스트리밍 BFF
- [ ] `app/read/[articleId]/page.tsx` — 기사 읽기/학습 페이지
- [ ] 메인 페이지 리팩토링 (기사 목록 + 영상 분석 통합)
- [ ] Web 빌드 검증

### Phase 5: Deep Learning (구조 분석 + 팝오버)

문장 구조 파싱, 단어 팝오버 기능

- [ ] AI: `services/study/sentence_parser.py` + `api/study/parse_sentence.py`
- [ ] AI: `services/study/word_lookup.py` + `api/study/word_lookup.py`
- [ ] Web: `app/api/study/parse/route.ts` + `app/api/study/lookup/route.ts`
- [ ] Web: `features/study/components/sentence-parser.tsx`
- [ ] Web: `features/study/hooks/use-text-selection.ts`
- [ ] Web: `features/study/components/selection-popover.tsx`
- [ ] 표시 모드 토글 (양쪽/원문만/번역만)

### Phase 6: 마무리

- [ ] 반응형 모바일 최적화
- [ ] 주요 한국 매체 기사 5건 통합 테스트
- [ ] 코드 정리

## Progress

| Metric | Value |
|--------|-------|
| Total Tasks | 0/30+ |
| Current Phase | - |
| Status | pending |

## Execution Log

| Timestamp | Phase | Task | Status |
|-----------|-------|------|--------|
| - | - | - | - |
