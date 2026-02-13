# Task Plan: UI Refactoring v3

> **Generated from**: docs/prd/PRD_ui-refactoring-v3.md
> **Created**: 2026-02-13
> **Status**: completed

## Execution Config

| Option | Value | Description |
|--------|-------|-------------|
| `auto_commit` | true | 완료 시 자동 커밋 |
| `commit_per_phase` | false | Phase별 중간 커밋 여부 |
| `quality_gate` | true | /auto-commit 품질 검사 |

## Phases

### Phase 1: Feature 통합 + 사이드바 정리
- [x] Article 타입 확장 — ExpressionCategory에 grammar_pattern, formal_expression, slang 추가
- [x] ExpressionSummary 컴포넌트 이식 — Study에서 Article로 이식, 스타일 조정
- [x] ExpressionBar 카테고리 라벨 추가 — 새 카테고리 표시 지원
- [x] /read 페이지 개선 — ?article= 파라미터, ExpressionSummary 추가, "New Article" 버튼
- [x] 사이드바 정리 — Articles 삭제, "Watch" 라벨, Learn 섹션 통합
- [x] 사이드바 오버레이 정리 — 모바일 오버레이도 동일 적용
- [x] Study 피처 삭제 — features/study/ 전체 디렉토리
- [x] Study 페이지 삭제 — app/study/ 디렉토리
- [x] Study API 삭제 — app/api/study/ 디렉토리
- [x] 빌드 검증 — next build 성공 확인

### Phase 2: 홈페이지 재설계
- [x] 큐레이션 콘텐츠 작성 — curated-articles.ts에 16개 학습 텍스트
- [x] ArticleCard 컴포넌트 — 난이도 배지 + 카테고리 + 제목 + 미리보기 + CTA
- [x] 홈페이지 재작성 — Liner Hero 인풋 + 카드 그리드
- [x] 반응형 그리드 — 3열/2열/1열 브레이크포인트
- [x] 빌드 검증

### Phase 3: 정리 + 검증
- [x] 불필요한 import/CSS 정리
- [x] 모바일 레이아웃 점검
- [x] 다크모드 점검
- [x] 전체 라우트 동작 확인
- [x] 최종 빌드 검증

## Progress

| Metric | Value |
|--------|-------|
| Total Tasks | 20/20 |
| Current Phase | - |
| Status | completed |

## Execution Log

| Timestamp | Phase | Task | Status |
|-----------|-------|------|--------|
| 2026-02-13 | Phase 1 | Article 타입 확장 | completed |
| 2026-02-13 | Phase 1 | ExpressionSummary 이식 | completed |
| 2026-02-13 | Phase 1 | ExpressionBar 라벨 추가 | completed |
| 2026-02-13 | Phase 1 | /read 페이지 개선 | completed |
| 2026-02-13 | Phase 1 | 사이드바 정리 | completed |
| 2026-02-13 | Phase 1 | 사이드바 오버레이 정리 | completed |
| 2026-02-13 | Phase 1 | Study 피처 삭제 | completed |
| 2026-02-13 | Phase 1 | Study 페이지 삭제 | completed |
| 2026-02-13 | Phase 1 | Study API 삭제 | completed |
| 2026-02-13 | Phase 1 | 빌드 검증 | completed |
| 2026-02-13 | Phase 2 | 큐레이션 콘텐츠 작성 | completed |
| 2026-02-13 | Phase 2 | ArticleCard 컴포넌트 | completed |
| 2026-02-13 | Phase 2 | 홈페이지 재작성 | completed |
| 2026-02-13 | Phase 2 | 반응형 그리드 | completed |
| 2026-02-13 | Phase 2 | 빌드 검증 | completed |
| 2026-02-13 | Phase 3 | import/CSS 정리 | completed |
| 2026-02-13 | Phase 3 | 모바일 레이아웃 점검 | completed |
| 2026-02-13 | Phase 3 | 다크모드 점검 | completed |
| 2026-02-13 | Phase 3 | 라우트 동작 확인 | completed |
| 2026-02-13 | Phase 3 | 최종 빌드 검증 | completed |
