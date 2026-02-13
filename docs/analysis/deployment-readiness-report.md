# WIGVU Production Deployment Readiness Report

**Date**: 2026-02-13
**Reviewers**: Security/DevOps Agent, Frontend Agent, Backend Agent, Architecture Agent
**Verdict**: **NOT PRODUCTION-READY** -- 15 Critical/High issues must be resolved before deployment

---

## Executive Summary

4 independent code review agents analyzed the WIGVU codebase in parallel, covering Security/DevOps (22 issues), Frontend (32 issues), Backend (30 issues), and Architecture (18 findings). After cross-review and deduplication, we identified **62 unique issues**: 11 Critical, 13 High, 22 Medium, and 16 Low severity.

The application has solid foundational engineering -- clean service separation, circuit breaker pattern, structured logging, health checks, rate limiting, and SSE streaming. However, **critical security gaps, infrastructure fragility, and missing operational tooling** make it unsuitable for production traffic without remediation.

### Key Blockers (Must fix before any deployment)
1. Live API keys baked into Docker images (no `.dockerignore`)
2. Internal service ports (3000/4000/5000) publicly exposed, bypassing nginx
3. Klaim payment URLs hardcoded to `localhost:3000`
4. `ErrorCode.CONFIGURATION_ERROR` runtime crash bug
5. No payment verification on success page

---

## Unified Findings by Severity

### CRITICAL (11 issues)

#### CR-01. Live API Keys Baked into Docker Images
| Field | Detail |
|-------|--------|
| **Agents** | Security, Architecture |
| **Files** | `apps/ai/.env`, `apps/ai/Dockerfile` (line 28) |
| **Issue** | `apps/ai/.env` contains real OpenAI and YouTube API keys. No `.dockerignore` exists for `apps/ai/` or `apps/api/`, so `COPY . .` in Dockerfiles copies `.env` files into images pushed to GHCR. |
| **Impact** | Anyone pulling GHCR images can extract live API keys. OpenAI key abuse could cause massive charges. |
| **Fix** | (1) **Immediately rotate both API keys** (2) Create `.dockerignore` for `apps/ai/` and `apps/api/` excluding `.env`, `__pycache__/`, `.git/` (3) Verify root `.gitignore` covers `apps/*/.env` |

#### CR-02. Internal Service Ports Exposed to Internet
| Field | Detail |
|-------|--------|
| **Agents** | Security, Architecture |
| **Files** | `docker-compose.hub.yml` (lines 36-37, 65-66, 103-104), `scripts/gce-create-instance.sh` (lines 42-46) |
| **Issue** | Production compose publishes ports 3000/4000/5000 on host via `ports:`. GCE firewall opens these ports to the internet. Anyone can bypass nginx (SSL, rate limiting, security headers). |
| **Impact** | Direct unauthenticated access to all services. AI service at :5000 has auth disabled when `INTERNAL_API_KEY` is empty. |
| **Fix** | (1) Change `ports:` to `expose:` for web/api/ai in `docker-compose.hub.yml` (2) Remove `allow-app-ports` firewall rule from `gce-create-instance.sh` (3) Only nginx should have `ports:` |

#### CR-03. Klaim Pricing Table Hardcoded to localhost
| Field | Detail |
|-------|--------|
| **Agents** | Security, Frontend, Architecture |
| **Files** | `apps/web/src/components/klaim-pricing-table.tsx` (lines 24-29) |
| **Issue** | Payment redirect URLs hardcoded to `http://localhost:3000/payment/success` and `cancel`. User email/name are dummy values (`example@example.com`, `John Doe`). |
| **Impact** | 100% payment flow failure in production. Users pay but get redirected to localhost. No user attribution. |
| **Fix** | Use `process.env.NEXT_PUBLIC_APP_URL` for URLs. Pass authenticated user data for email/name. |

#### CR-04. `ErrorCode.CONFIGURATION_ERROR` Does Not Exist -- Runtime Crash
| Field | Detail |
|-------|--------|
| **Agents** | Backend |
| **Files** | `apps/ai/app/services/translation.py` (line 46) |
| **Issue** | References `ErrorCode.CONFIGURATION_ERROR` which does not exist in the `ErrorCode` enum. When OpenAI API key is missing, this raises `AttributeError` instead of the intended `AIServiceError`. |
| **Impact** | Every translation request crashes with an opaque error when the OpenAI key is misconfigured. |
| **Fix** | Add `CONFIGURATION_ERROR = "CONFIGURATION_ERROR"` to the `ErrorCode` enum, or change to existing `ErrorCode.SERVICE_UNAVAILABLE`. |

#### CR-05. Payment Success Page Has No Server-Side Verification
| Field | Detail |
|-------|--------|
| **Agents** | Frontend |
| **Files** | `apps/web/src/app/payment/success/page.tsx` (lines 11-17) |
| **Issue** | Page reads `session_id` from URL params and logs to console. No backend verification. Any user can navigate to `/payment/success?session_id=fake` and see success screen. |
| **Impact** | Subscription fraud. Users bypass payment entirely. |
| **Fix** | Implement server-side payment verification via webhook or API call validating `session_id` before showing success. |

#### CR-06. Dual-Path Orchestration Creates Maintenance Hazard
| Field | Detail |
|-------|--------|
| **Agents** | Architecture, (Frontend implied) |
| **Files** | `apps/web/src/app/api/analyze/route.ts`, `apps/api/src/modules/analysis/analysis.service.ts`, `nginx/nginx.conf` (lines 83-116) |
| **Issue** | Full analysis pipeline (metadata, transcript, translation, AI) is implemented independently in both Next.js API routes and NestJS API. Different error handling, caching, rate limits, and timeouts. |
| **Impact** | Bug fixes must be applied in two places. Next.js path bypasses NestJS circuit breaker and cache. Users get different reliability characteristics. |
| **Fix** | Consolidate all orchestration into NestJS API. Next.js routes should proxy to `/api/v1/analysis` or be removed. **Highest-impact architectural change.** |

#### CR-07. No Authentication on API Gateway
| Field | Detail |
|-------|--------|
| **Agents** | Backend |
| **Files** | `apps/api/src/main.ts` (lines 22-27) |
| **Issue** | NestJS API has no JWT, session, or API key authentication. CORS defaults to `*`. Anyone can consume YouTube API quota, OpenAI tokens, and STT resources. |
| **Impact** | Denial-of-wallet attack. API costs spiral from abuse. |
| **Fix** | Implement API key guard or JWT authentication for non-health endpoints. Add per-IP rate limits as minimum. |

#### CR-08. No Rate Limiting on Next.js API Routes
| Field | Detail |
|-------|--------|
| **Agents** | Frontend |
| **Files** | `apps/web/src/app/api/analyze/route.ts`, `apps/web/src/app/api/analyze/stream/route.ts` |
| **Issue** | POST handlers have no rate limiting, authentication, or CSRF protection. Anyone can trigger expensive AI analysis repeatedly. |
| **Impact** | Combined with CR-07, both API paths are unprotected. |
| **Fix** | If consolidating to NestJS (CR-06), this resolves automatically. Otherwise add middleware-based rate limiting. |

#### CR-09. Memory Budget Exhausted on 4 GB VM
| Field | Detail |
|-------|--------|
| **Agents** | Architecture, Backend |
| **Files** | `docker-compose.hub.yml` (memory limits), `scripts/gce-create-instance.sh` (line 11) |
| **Issue** | Container limits sum to 2 GB (web:512M + api:512M + ai:1G). OS/Docker needs ~1 GB. FFmpeg + 500MB max audio files in AI container. Nginx has no limit. |
| **Impact** | OOM kills under moderate load. Cascading restarts bring down entire stack. |
| **Fix** | (1) Upgrade to e2-standard-2 (8 GB) or add swap (2) Set nginx limit (128M) (3) Increase AI to 2 GB (4) Add `oom_score_adj` priority |

#### CR-10. Audio Files Fully Loaded into Memory -- OOM Risk
| Field | Detail |
|-------|--------|
| **Agents** | Backend |
| **Files** | `apps/ai/app/api/stt.py` (line 53), `apps/api/src/services/audio-download.service.ts` (lines 51-59) |
| **Issue** | `audio_data = await audio.read()` reads entire file (up to 500 MB). Multiple concurrent requests can spike to 5 GB. |
| **Impact** | Immediate OOM kills. Combined with CR-09, this is the primary crash vector. |
| **Fix** | Lower `max_file_size_mb` to 100 MB. Use streaming/chunked upload. Add maximum buffer size guard. |

#### CR-11. `openai` Package in Frontend Dependencies
| Field | Detail |
|-------|--------|
| **Agents** | Frontend |
| **Files** | `apps/web/package.json` (line 19) |
| **Issue** | `openai ^6.15.0` in runtime dependencies but never imported anywhere in `src/`. Inflates Docker image and creates risk of accidental client-side import leaking API keys. |
| **Impact** | Bloated image, potential key exposure, unnecessary attack surface. |
| **Fix** | Remove `openai` from `apps/web/package.json`. AI analysis is delegated to NestJS API. |

---

### HIGH (13 issues)

#### HI-01. CORS Wildcard in Production
| **Agents** | Security, Backend, Architecture |
|------------|------|
| **Files** | `apps/api/src/main.ts` (line 24), `apps/ai/main.py` (lines 73-79), `docker-compose.hub.yml` (line 70) |
| **Issue** | API defaults to `*`. AI has `allow_origins=["*"]` with `allow_credentials=True`. Production compose defaults `CORS_ORIGIN` to `localhost`. |
| **Fix** | Set `CORS_ORIGIN=https://app.wigtn.com` in production. Remove CORS from AI service (internal only). |

#### HI-02. Missing Content-Security-Policy and Security Headers Gap
| **Agents** | Security, Frontend, Architecture |
|------------|------|
| **Files** | `nginx/nginx.conf` (lines 74-80, 144-151) |
| **Issue** | No CSP header, no Permissions-Policy, no `server_tokens off`. Static files location block replaces all security headers. |
| **Fix** | Add CSP (allowing `embed.klaim.me`), Permissions-Policy. Use shared include for security headers. Add `server_tokens off`. |

#### HI-03. Synchronous OpenAI Calls Block Event Loop
| **Agents** | Backend |
|------------|------|
| **Files** | `apps/ai/app/services/llm.py` (lines 303-335), `apps/ai/app/services/translation.py` (lines 120-129) |
| **Issue** | `async def` functions use synchronous `client.chat.completions.create()`. Blocks event loop for 10-30 seconds per call. `asyncio.gather()` provides zero actual concurrency. |
| **Fix** | Use `openai.AsyncOpenAI` with `await client.chat.completions.acreate()`. |

#### HI-04. No Container Image Versioning
| **Agents** | Security |
|------------|------|
| **Files** | `docker-compose.hub.yml` (lines 35, 63, 102) |
| **Issue** | All services use `:latest` tags. No rollback capability. |
| **Fix** | Use `IMAGE_TAG=${GITHUB_SHA}` variable. Pin versions in compose. |

#### HI-05. Docker Image Includes All devDependencies
| **Agents** | Backend |
|------------|------|
| **Files** | `apps/api/Dockerfile` (line 34) |
| **Issue** | Production stage copies entire `node_modules` from builder, including jest, eslint, prettier, typescript, etc. |
| **Fix** | Add `npm ci --omit=dev` in runner stage instead of copying builder's node_modules. |

#### HI-06. Massive page.tsx (620 lines) with Duplicated JSX
| **Agents** | Frontend |
|------------|------|
| **Files** | `apps/web/src/app/page.tsx` |
| **Issue** | Single "use client" component. Steps section copy-pasted for carousel clones. 90+ lines of commented-out code. Debug comments. |
| **Fix** | Extract components (`StepsSection`, `FeaturesSection`, etc.). Delete commented-out code. Move carousel logic to custom hook. |

#### HI-07. Entire Landing Page is Client-Rendered (No SSR/SSG)
| **Agents** | Frontend |
|------------|------|
| **Files** | `apps/web/src/app/page.tsx` (line 1: `"use client"`) |
| **Issue** | All landing content is invisible to search engine crawlers. Poor Core Web Vitals. |
| **Fix** | Split into Server Component parent (static content) + client carousel wrapper. |

#### HI-08. No SEO Metadata, Open Graph Tags, Sitemap, or robots.txt
| **Agents** | Frontend |
|------------|------|
| **Files** | `apps/web/src/app/layout.tsx` (lines 17-20) |
| **Issue** | Only `title` and `description`. No OG tags, Twitter cards, canonical URLs, sitemap, or robots.txt. |
| **Fix** | Add comprehensive metadata, `app/sitemap.ts`, `app/robots.ts`. Add per-page `generateMetadata`. |

#### HI-09. Certificate Verification Disabled in yt-dlp
| **Agents** | Backend |
|------------|------|
| **Files** | `apps/ai/app/services/youtube_audio.py` (line 52) |
| **Issue** | `nocheckcertificate: True` disables TLS verification for YouTube downloads. MITM vulnerability. |
| **Fix** | Remove `nocheckcertificate: True`. Install CA certificates in Docker image if needed. |

#### HI-10. Transcript Scraping via YouTube HTML is Fragile
| **Agents** | Backend |
|------------|------|
| **Files** | `apps/api/src/modules/transcript/transcript.service.ts` (lines 98-173) |
| **Issue** | Regex-based HTML scraping with User-Agent spoofing. YouTube page structure changes will silently break all transcript fetches. |
| **Fix** | Use `youtube-transcript-api` npm package or official YouTube Data API `captions.download`. |

#### HI-11. No Monitoring, Alerting, or Health Dashboard
| **Agents** | Frontend, Architecture |
|------------|------|
| **Files** | Global (no monitoring configuration found) |
| **Issue** | Zero metrics collection, alerting, uptime monitoring, or log aggregation. Docker health checks exist but nothing acts on status. |
| **Fix** | (1) Add UptimeRobot free tier (2) Deploy cadvisor for container metrics (3) Forward logs to Cloud Logging. |

#### HI-12. No Test Infrastructure
| **Agents** | Frontend, Backend, Architecture |
|------------|------|
| **Files** | CI only runs `npm run build` / `py_compile` |
| **Issue** | Zero test files in web/api. AI has 6 test files (happy paths only). No testing framework configured for web. |
| **Fix** | Add Vitest + RTL for web, Jest for API, expand pytest for AI. Add test steps to CI. |

#### HI-13. No CD Pipeline for Deployment
| **Agents** | Architecture |
|------------|------|
| **Files** | `.github/workflows/ci.yml` |
| **Issue** | CI only validates builds. No Docker image build, no GHCR push, no deployment trigger. Deployment is fully manual SSH. |
| **Fix** | Add CD workflow: build images, push to GHCR, SSH deploy with health check. |

---

### MEDIUM (22 issues)

| ID | Issue | Agents | Key File(s) |
|----|-------|--------|-------------|
| ME-01 | INTERNAL_API_KEY defaults to empty (auth disabled) | Security, Architecture | `apps/ai/app/config.py:15` |
| ME-02 | GCE setup script references non-existent `docker-compose.gce.yml` | Security, Architecture | `scripts/gce-setup.sh:61` |
| ME-03 | SSL renewal script references non-existent `docker-compose.prod.yml` | Security, Architecture | `scripts/renew-ssl.sh:25` |
| ME-04 | SSL renewal causes downtime (standalone mode) | Architecture | `scripts/renew-ssl.sh` |
| ME-05 | Default domain is placeholder `yourdomain.com` | Security | `scripts/renew-ssl.sh:7` |
| ME-06 | GCE instance uses overly broad `--scopes=cloud-platform` | Security | `scripts/gce-create-instance.sh:68` |
| ME-07 | GITHUB_TOKEN passed via SSH command argument | Security | `.github/workflows/cd.yml:211` |
| ME-08 | Health check only validates localhost, not HTTPS | Security | `.github/workflows/cd.yml:318` |
| ME-09 | No www-to-non-www redirect | Security | `nginx/nginx.conf:39` |
| ME-10 | Deployment causes full-stack restart downtime | Architecture | `docker-compose.hub.yml` |
| ME-11 | In-memory cache volatile, AI results not cached | Architecture | `apps/api/src/app.module.ts` |
| ME-12 | Single-worker uvicorn in AI service | Architecture | `apps/ai/Dockerfile:36` |
| ME-13 | No graceful shutdown (`enableShutdownHooks` missing) | Backend, Architecture | `apps/api/src/main.ts` |
| ME-14 | `enableImplicitConversion: true` in ValidationPipe | Backend | `apps/api/src/main.ts:36` |
| ME-15 | Translation error handler catches too broadly (swallows errors) | Backend | `apps/ai/app/api/translate.py:108` |
| ME-16 | Rate limit mismatch between API and AI services | Backend | `apps/api/src/app.module.ts:28`, `apps/ai/app/config.py:25` |
| ME-17 | yt-dlp runs synchronously in async context | Backend | `apps/ai/app/services/youtube_audio.py:55` |
| ME-18 | Third-party Klaim script loaded without SRI/CSP | Frontend | `klaim-pricing-table.tsx:6-17` |
| ME-19 | `sessionStorage` for navigation state is fragile | Frontend | `apps/web/src/app/page.tsx:199` |
| ME-20 | YouTube IFrame API loader polls indefinitely | Frontend | `apps/web/src/lib/youtube-api-loader.ts:27` |
| ME-21 | Duplicate `needsTranslation` function | Frontend | `transcript.ts:190`, `translation.ts:114` |
| ME-22 | Hard-coded 50,000 char transcript truncation (silent) | Backend | `apps/api/src/modules/analysis/analysis.service.ts:148` |

---

### LOW (16 issues)

| ID | Issue | Agents | Key File(s) |
|----|-------|--------|-------------|
| LO-01 | Dev compose publishes ports on all interfaces | Security | `docker-compose.yml` |
| LO-02 | `picsum.photos` in image remote patterns (dev artifact) | Security, Frontend | `apps/web/next.config.ts:17` |
| LO-03 | Placeholder API keys in `apps/api/.env` | Security | `apps/api/.env` |
| LO-04 | `console.log` leaks payment session ID | Security, Frontend | `payment/success/page.tsx:15` |
| LO-05 | `100vh` breaks on mobile Safari | Frontend | `globals.css:164` |
| LO-06 | Carousel keyboard captures all arrow key events | Frontend | `page.tsx:169-176` |
| LO-07 | No ARIA labels on carousel navigation | Frontend | `page.tsx:443-483` |
| LO-08 | Stale placeholder assets in `/public` | Frontend | `apps/web/public/` |
| LO-09 | Error boundary shows stack traces in production | Frontend | `error-boundary.tsx:50-60` |
| LO-10 | Mock data file shipped in production | Frontend | `apps/web/src/lib/mock-data.ts` |
| LO-11 | `VideoMetadata` interface defined in 3 places | Frontend | `types/analysis.ts`, `youtube-metadata.ts`, `ai-analysis.ts` |
| LO-12 | AI tests only cover happy paths | Backend | `apps/ai/tests/` |
| LO-13 | Inconsistent logging (structlog vs stdlib logging) | Backend | `apps/ai/app/api/translate.py:19` |
| LO-14 | Hardcoded version "1.0.0" in health check | Backend | `health.controller.ts:21` |
| LO-15 | Python packages not pinned (uses `>=`) | Backend | `apps/ai/requirements.txt` |
| LO-16 | Nginx location ordering may rate-limit health checks | Architecture | `nginx/nginx.conf:119` |

---

## Cross-Review: Conflicts and Consensus

### Consensus Points (All agents agree)
- **Ports must be closed** before deployment (CR-02). Every agent flagged this.
- **CORS must be restricted** (HI-01). Three agents independently identified the same risk.
- **No tests + no CD = high deployment risk**. All agents agree test infrastructure is a prerequisite for safe refactoring.
- **Dual-path orchestration** must be consolidated. Frontend and Architecture agents both flagged the maintenance hazard.

### Reconciled Conflicts
| Topic | Agent A Says | Agent B Says | Resolution |
|-------|-------------|-------------|------------|
| **Rate limiting approach** | Security: nginx is sufficient | Backend: per-service limits conflict with gateway | **Both are right.** Disable AI service IP-based rate limiting for requests from API gateway (trusted via `X-Internal-API-Key`). Keep nginx rate limits as the public-facing defense. |
| **CSP configuration** | Security: strict CSP in nginx | Frontend: use `next.config.ts` `headers()` | **Use nginx.** CSP in nginx covers all responses including static files. `next.config.ts` headers only apply to Next.js-rendered pages. |
| **VM upgrade necessity** | Architecture: upgrade to e2-standard-2 (8 GB, +$25/mo) | Backend: fix memory usage patterns | **Both.** Fix the 500 MB audio buffer (CR-10) AND upgrade VM. Memory fixes reduce peak usage, VM upgrade provides headroom. |
| **Test priority** | Frontend: add Vitest + Playwright | Backend: prioritize API service tests | **Sequential.** Write backend API tests first (highest risk area), then frontend component tests. E2E tests last. |

---

## Prioritized Action Plan

### Phase 0: Emergency Fixes (Before ANY deployment)
**Estimated effort: 1-2 days**

| # | Action | Issues Resolved | Effort |
|---|--------|----------------|--------|
| 1 | Rotate all API keys (OpenAI, YouTube) | CR-01 | 30 min |
| 2 | Create `.dockerignore` for `apps/ai/` and `apps/api/` | CR-01 | 15 min |
| 3 | Change `ports:` to `expose:` in `docker-compose.hub.yml` | CR-02 | 15 min |
| 4 | Remove `allow-app-ports` firewall rule | CR-02 | 15 min |
| 5 | Fix `ErrorCode.CONFIGURATION_ERROR` enum | CR-04 | 10 min |
| 6 | Fix Klaim URLs to use `NEXT_PUBLIC_APP_URL` env var | CR-03 | 30 min |
| 7 | Remove `openai` from web `package.json` | CR-11 | 5 min |

### Phase 1: Security Hardening (Before go-live)
**Estimated effort: 3-5 days**

| # | Action | Issues Resolved | Effort |
|---|--------|----------------|--------|
| 8 | Set explicit CORS origins for production | HI-01 | 1 hr |
| 9 | Add CSP, Permissions-Policy headers to nginx | HI-02 | 2 hrs |
| 10 | Fix static file location header inheritance | HI-02 | 1 hr |
| 11 | Make `INTERNAL_API_KEY` required in production | ME-01 | 1 hr |
| 12 | Implement payment server-side verification | CR-05 | 4 hrs |
| 13 | Add basic authentication to API gateway | CR-07, CR-08 | 8 hrs |
| 14 | Fix all broken script references (compose filenames) | ME-02, ME-03, ME-05 | 1 hr |
| 15 | Remove `nocheckcertificate: True` from yt-dlp | HI-09 | 15 min |
| 16 | Add `server_tokens off` to nginx | HI-02 | 5 min |

### Phase 2: Infrastructure Stabilization (Before stable traffic)
**Estimated effort: 3-5 days**

| # | Action | Issues Resolved | Effort |
|---|--------|----------------|--------|
| 17 | Upgrade VM to e2-standard-2 (8 GB) | CR-09 | 1 hr |
| 18 | Lower max file size, add streaming for audio | CR-10 | 4 hrs |
| 19 | Switch to `AsyncOpenAI` for all OpenAI calls | HI-03 | 3 hrs |
| 20 | Add uvicorn workers (`--workers 2`) | ME-12 | 15 min |
| 21 | Fix SSL renewal (webroot mode, correct compose file) | ME-04 | 2 hrs |
| 22 | Add image versioning (SHA tags) | HI-04 | 2 hrs |
| 23 | Prune devDependencies from API Docker image | HI-05 | 1 hr |
| 24 | Add `enableShutdownHooks()` + `stop_grace_period` | ME-13 | 1 hr |
| 25 | Add uptime monitoring (UptimeRobot free) | HI-11 | 30 min |
| 26 | Add CD workflow (build, push, deploy) | HI-13 | 4 hrs |

### Phase 3: Architecture & Quality (Before v2 features)
**Estimated effort: 1-2 weeks**

| # | Action | Issues Resolved | Effort |
|---|--------|----------------|--------|
| 27 | Consolidate orchestration to NestJS API | CR-06, CR-08, ME-11 | 3 days |
| 28 | Split page.tsx into Server + Client components | HI-06, HI-07 | 2 days |
| 29 | Add SEO metadata, OG tags, sitemap, robots.txt | HI-08 | 1 day |
| 30 | Add test infrastructure (Vitest, Jest, pytest) | HI-12 | 2 days |
| 31 | Use official YouTube API for transcripts | HI-10 | 1 day |
| 32 | Cache AI analysis results | ME-11 | 4 hrs |
| 33 | Fix rate limit alignment (API <-> AI) | ME-16 | 2 hrs |

### Phase 4: Polish (Ongoing)
All remaining Medium and Low issues from the tables above.

---

## Cost Impact

| Item | Current | Recommended | Delta |
|------|---------|-------------|-------|
| VM | e2-medium (4 GB) | e2-standard-2 (8 GB) | +~$25/mo |
| Monitoring | None | UptimeRobot Free + GCP free tier | $0 |
| CD Pipeline | Manual SSH | GitHub Actions (2000 min/mo free) | $0 |
| **Total** | | | **+~$25/mo** |

---

## Risk Matrix

```
        High Impact
            |
    CR-01   |   CR-02    CR-09
    CR-04   |   CR-06    CR-07
            |   HI-03    HI-12
            |
Low Effort -+-------------- High Effort
            |
    HI-01   |   HI-10
    HI-04   |   HI-13
    ME-01   |   CR-05
            |
        Low Impact
```

**Quick Wins** (top-left): CR-01, CR-02, CR-04, HI-01, HI-04, ME-01
**Strategic Investments** (top-right): CR-06, CR-09, HI-03, HI-12, HI-13
**Nice-to-haves** (bottom): All Low severity items

---

## Individual Agent Reports

The full detailed reports from each agent are available:
- Security & DevOps: 22 issues (4 Critical, 5 High, 8 Medium, 5 Low)
- Frontend: 32 issues (4 Critical, 7 High, 11 Medium, 11 Low)
- Backend: 30 issues (4 Critical, 8 High, 12 Medium, 6 Low)
- Architecture: 18 findings (3 Critical, 4 High, 7 Medium, 3 Low)

---

*Generated by Claude Code Team Review -- 4 parallel agents with cross-review synthesis*
