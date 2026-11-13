# Frontend Build Prompt — Digital Beneficiary Identification System

> **How to use this file:** Paste this entire document as the instruction/prompt to your AI coding tool (Claude Code, Cursor, etc.) to generate the frontend. It is self-contained: it includes the product vision, the exact backend API contract (pulled from the real Spring Boot source), the information architecture, and the visual design system.

---

## 1. Project Summary

Build a modern, premium, interactive citizen-service **frontend** for the **Digital Beneficiary Identification System** — a platform that helps citizens describe a need in plain language, discover matching government welfare schemes, upload documents, get an automated eligibility check, and follow a guided application path.

Functionally it should follow the **information flow of myScheme** (need → discover → eligibility → documents → apply), but visually it must **not** look like a traditional government portal. Think **"myScheme redesigned as a 2026 premium fintech/SaaS product with a Digital India identity."**

The frontend must connect to a **real, already-built Spring Boot backend** — do not use hardcoded/mock scheme data in the final integration layer (mock data is fine only as a temporary Storybook/dev fallback, clearly isolated behind a service interface).

Authentication (login/signup/forgot-password) is **out of scope for this build**, but the architecture (routing, API client, state layer) must be structured so auth can be slotted in later without a rewrite (e.g., a reserved `AuthProvider`/`ProtectedRoute` seam, a token-attachment point in the API client, user-scoped state kept separate from anonymous session state).

---

## 2. Backend Reference (already implemented — do not redesign, only consume)

**Base URL:** `http://localhost:8080` (make this an environment variable, e.g. `VITE_API_BASE_URL`)
**Content type:** `application/json` everywhere except document upload, which is `multipart/form-data`.

> ⚠️ **Backend note to flag back to the user:** the Spring Boot backend currently has **no CORS configuration** (`@CrossOrigin` / `WebMvcConfigurer` not present). The frontend dev server will hit CORS errors calling `localhost:8080` directly until the backend adds a CORS policy (or the frontend dev server proxies `/api` to `localhost:8080`). Set up a Vite dev proxy for `/api` as the default, and note in the README that production needs backend CORS enabled for the deployed frontend origin.

### 2.1 Workflow lifecycle

```
CREATED → SCHEMES_RECOMMENDED → SCHEME_SELECTED → DOCUMENTS_REQUIRED → DOCUMENTS_UPLOADED
```

### 2.2 Citizen-facing endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/workflows` | Create a workflow from free-text need. Body: `{ "need": "string" }`. Returns workflow with AI-derived `intentJson` and status `SCHEMES_RECOMMENDED`. |
| `GET` | `/api/workflows/{id}` | Get workflow + `recommendedSchemes[]`. |
| `GET` | `/api/workflows/{workflowId}/profile` | Get the fused beneficiary profile extracted from all uploaded documents, plus `conflictDetected` / `conflicts[]`. |
| `POST` | `/api/workflows/{workflowId}/eligibility/evaluate` | Run eligibility check against the fused profile. Returns `status` (`ELIGIBLE` / `INELIGIBLE` / `MANUAL_REVIEW` / `INSUFFICIENT_INFORMATION`), `schemeResults` (per-criterion booleans), `missingFields[]`, `conflicts[]`, `explanation[]`. |
| `POST` | `/api/workflows/{workflowId}/schemes/{schemeId}/select` | Select a recommended scheme. Sets status `SCHEME_SELECTED`. |
| `GET` | `/api/workflows/{workflowId}/requirements` | List required documents for the selected scheme: `[{ documentType, mandatory }]`. |
| `GET` | `/api/workflows/{workflowId}/application` | Full application guidance: `schemeName`, `benefits`, `eligibilitySummary`, `howToApply`, `requiredDocuments[]`, `officialLink`, `applicationLink`. |
| `POST` | `/api/documents/upload` | `multipart/form-data` with fields `workflowId` (Long) and `file`. Returns document with `status` and extracted `beneficiaryJson`. Supports PNG/JPG/PDF. |
| `GET` | `/api/schemes` | List **all** government schemes (public catalog — use for the Schemes browse page, category cards, and scheme detail pages). |

### 2.3 Moderator/admin endpoints (for the separate moderator interface)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/schemes?active={bool}&category={string}` | List schemes with optional filters. |
| `GET` | `/api/admin/schemes/pending-review` | Schemes awaiting verification. |
| `POST` | `/api/admin/schemes` | Create a scheme. Body = `SchemeRequest` (see 2.5). |
| `PUT` | `/api/admin/schemes/{id}` | Update a scheme. Body = `SchemeRequest`. |
| `PATCH` | `/api/admin/schemes/{id}/activate` | Activate. |
| `PATCH` | `/api/admin/schemes/{id}/deactivate` | Deactivate. |
| `PATCH` | `/api/admin/schemes/{id}/verify` | Mark verified. |
| `POST` | `/api/admin/schemes/import` | `multipart/form-data`, field `file`. Bulk import. Returns `ImportResult`: `{ imported, updated, skipped, errors: [{ row, reason }] }`. |

> **No dedicated `/stats` endpoint exists.** Compute the moderator dashboard stat tiles (**Total, Imported, Active, Verified**) client-side by fetching `GET /api/admin/schemes` (all, unfiltered) and deriving counts: `total = length`, `imported = count(source === "IMPORTED")`, `active = count(active === true)`, `verified = count(verified === true)`. Isolate this in a single `useSchemeStats()` hook so it's trivial to swap for a real `/api/admin/schemes/stats` endpoint later without touching UI.

### 2.4 `GovernmentScheme` object shape (used across public + admin)

```json
{
  "id": 1,
  "schemeName": "National Scholarship Scheme",
  "slug": "national-scholarship-scheme",
  "category": "Education",
  "level": null,
  "description": "Financial support for eligible students pursuing studies after Class VIII.",
  "benefits": "Annual scholarship assistance for education-related expenses.",
  "eligibility": "Indian students studying in a recognized institution...",
  "documentsRequired": "AADHAAR,INCOME_CERTIFICATE,STUDENT_CERTIFICATE",
  "application": null,
  "officialLink": "https://scholarships.gov.in/",
  "applicationLink": "https://scholarships.gov.in/",
  "state": "All India",
  "department": "Ministry of Education",
  "keywords": "scholarship,student,education,income",
  "status": "OPEN",
  "launchDate": "2015-01-01",
  "eligibilityScore": 80,
  "active": true,
  "recommendationCount": 0,
  "lastUpdated": "2025-01-01T10:00:00",
  "source": "MANUAL",
  "verified": true
}
```

Notes for UI mapping:
- `documentsRequired` and `keywords` are **comma-separated strings**, not arrays — split them client-side.
- `status` is scheme lifecycle (`"OPEN"`/`"CLOSED"`), unrelated to `active`/`verified` booleans — surface all three distinctly in the moderator table (e.g. a status pill for OPEN/CLOSED, and separate toggle chips for Active/Verified).
- `source` is `"MANUAL"` or `"IMPORTED"` — use for the moderator stat tile and as a filter/badge.

### 2.5 `SchemeRequest` (create/update body for admin)

```json
{
  "schemeName": "string (required)",
  "category": "string",
  "description": "string",
  "benefits": "string",
  "eligibility": "string",
  "documentsRequired": "string (comma-separated)",
  "officialLink": "string",
  "applicationLink": "string",
  "state": "string",
  "department": "string",
  "keywords": "string (comma-separated)",
  "status": "OPEN | CLOSED",
  "launchDate": "YYYY-MM-DD",
  "eligibilityScore": 0,
  "active": true,
  "recommendationCount": 0
}
```

### 2.6 Document classification & status enums

- `DocumentStatus`: `UPLOADED`, `OCR_PROCESSED`, `CLASSIFIED_AND_EXTRACTED`, `OCR_FAILED`
- `DocumentClassification`: `AADHAAR`, `PAN`, `INCOME_CERTIFICATE`, `CASTE_CERTIFICATE`, `RESIDENCE_CERTIFICATE`, `STUDENT_CERTIFICATE`, `DISABILITY_CERTIFICATE`, `UNKNOWN`
- Document upload returns **HTTP 422** if the document can't be classified — the upload UI must handle this as a distinct "couldn't recognize this document" state (not a generic error toast), with a retry/re-upload affordance.

### 2.7 Error shape

Standard Spring Boot error body (no `message` field — surface `error` and `status`):

```json
{ "timestamp": "...", "status": 422, "error": "Unprocessable Entity", "path": "/api/documents/upload" }
```

Build one central API-error normalizer that maps `status` → a friendly, in-voice message per known case (400/404/422/500), rather than showing raw backend text anywhere.

### 2.8 Canonical happy-path sequence (mirror this exactly in the citizen flow's state machine)

```
1.  POST   /api/workflows                                 → create workflow
2.  GET    /api/workflows/{id}                             → show recommended schemes
3.  POST   /api/documents/upload  (repeat per document)     → upload & process each doc
4.  GET    /api/workflows/{id}/profile                      → show fused profile + conflicts
5.  POST   /api/workflows/{id}/eligibility/evaluate          → show eligibility result
6.  POST   /api/workflows/{id}/schemes/{schemeId}/select     → confirm scheme choice
7.  GET    /api/workflows/{id}/requirements                  → show required documents checklist
8.  GET    /api/workflows/{id}/application                   → show step-by-step apply guidance
```

---

## 3. Tech Stack

- **React + TypeScript + Vite**
- **React Router** for routing (public site, citizen dashboard, moderator interface as distinct route trees)
- **TanStack Query** for all server state (workflow, schemes, documents, eligibility, admin) — no ad hoc `useEffect` fetching
- A single typed **API client module** (`/src/api/client.ts`) wrapping `fetch`/`axios`, reading `VITE_API_BASE_URL`, with one seam for attaching an auth token later
- **Tailwind CSS** for styling, plus a small design-token layer (CSS variables) for the color/type system in Section 5
- **Zustand** (or React Context) only for local UI/session state (current workflow id, upload progress, wizard step) — never for server data
- **Framer Motion** for scroll reveals and micro-interactions
- Form/file handling: native file input + drag-drop, client-side validation (file type/size) before hitting `/api/documents/upload`

Folder structure to generate:

```
src/
  api/            # typed client + one file per resource (workflows, documents, schemes, admin)
  components/     # shared UI primitives (Button, Card, Badge, StatTile, ProgressStepper...)
  features/
    landing/
    scheme-catalog/
    citizen-dashboard/   # need input, recommendations, scheme detail, documents, eligibility, application, history
    moderator/           # stats, scheme table, scheme editor, import, pending-review
  hooks/
  lib/            # formatters, enum maps, the API-error normalizer
  routes/
  styles/
```

---

## 4. Information Architecture

### 4.1 Public marketing site (unauthenticated, always reachable)

- **Navbar** — logo/name, links: Home · Schemes · How It Works · Technology · FAQ, plus a prominent **"Find Schemes"** CTA button that routes into the citizen flow (Section 4.2).
- **Hero** — one clear sentence: describe your need in plain language, get matched to real government schemes. Primary CTA opens the need-input step; secondary CTA scrolls to "How It Works."
- **Interactive vertical roadmap** (scroll-driven reveal, one stage at a time as the user scrolls): 
  1. Tell the system what you need 
  2. Understanding the requirement (AI intent extraction) 
  3. Discovering schemes 
  4. Reviewing eligibility & documents 
  5. Checking eligibility 
  6. Getting application guidance
- **Category cards** (grid, modern rounded cards): Education, Employment, Agriculture, Housing, Women & Child, Health, Scholarships, Skills, Social Welfare. Each links into the Schemes catalog pre-filtered by `category`, sourced from `GET /api/schemes` (derive the category list from real data, don't hardcode counts).
- **Schemes** page — browsable/filterable catalog backed by `GET /api/schemes` (filter/search client-side over category, state, keywords).
- **How It Works**, **Technology**, **FAQ** — static content sections; keep copy specific to this system's real pipeline (OCR, AI intent extraction, document fusion, eligibility scoring) rather than generic filler.
- **Footer** — sitemap, scheme categories, contact/about, Digital India–style credibility markers (no fake government emblems).

### 4.2 Citizen dashboard flow (the personalized, stateful journey)

State-driven by the workflow lifecycle in §2.8:

1. **Describe your need** — free-text input → `POST /api/workflows`.
2. **Recommended schemes** — list from `GET /api/workflows/{id}`, filterable, each card opens a **scheme detail page** (benefits, eligibility, documents required, application info, sourced from the same object plus `GET /api/schemes` for canonical detail).
3. **Select a scheme** → `POST /api/workflows/{id}/schemes/{schemeId}/select`.
4. **Upload documents** — drag/drop per required type, `POST /api/documents/upload`, live per-file status (uploading → processing → classified/extracted → failed) using `DocumentStatus`.
5. **Review extracted profile** — `GET /api/workflows/{id}/profile`; if `conflictDetected`, show a clear conflict-resolution panel listing each field's differing values by document.
6. **Eligibility result** — `POST /api/workflows/{id}/eligibility/evaluate`; render `schemeResults` as a checklist (state/gender/age/income/occupation/document — matched or not), `explanation[]` as supporting text, and a status badge (green = ELIGIBLE, red = INELIGIBLE, amber = MANUAL_REVIEW/INSUFFICIENT_INFORMATION).
7. **Application guidance** — `GET /api/workflows/{id}/requirements` + `GET /api/workflows/{id}/application`, rendered as a step-by-step stepper ending in the official `applicationLink`/`officialLink` (external link, clearly marked as leaving the platform).
8. **Results / History** — a view listing past workflows (workflow id, need, status, outcome) for this session/user, each reopenable to its current stage. Since there's no auth yet, persist the list of workflow IDs the citizen has created in local/session storage as a stand-in, structured so it can be swapped for a real "my workflows" backend call once auth exists.

### 4.3 Moderator interface (visually and structurally separate — its own layout shell, not a tab in the citizen app)

- **Stats overview** — four tiles: Total, Imported, Active, Verified (derived per §2.3).
- **Scheme management table** — from `GET /api/admin/schemes` with `active`/`category` filters; per-row actions: activate/deactivate (`PATCH`), verify (`PATCH`), edit (opens the scheme editor → `PUT`).
- **Scheme editor** — create (`POST`) / edit (`PUT`) form matching `SchemeRequest` exactly (§2.5).
- **Pending review** — from `GET /api/admin/schemes/pending-review`, a queue-style view for verifying newly imported/unverified schemes.
- **Bulk import** — file upload to `POST /api/admin/schemes/import`; render `ImportResult` as imported/updated/skipped counts plus a per-row error table.

---

## 5. Visual Design System

Design brief: **"What if myScheme were redesigned as a modern 2026 digital public-service platform?"** — premium fintech/SaaS polish plus a restrained Digital India identity. Avoid the generic AI-design defaults (cream+terracotta, near-black+acid-green, or zero-radius newspaper layouts) — this brief already specifies its own direction below, so follow it exactly rather than defaulting.

**Color tokens** (define as CSS variables, then Tailwind theme extensions):
- `--color-primary` — deep navy/indigo (e.g. `#131B3E` / `#1E2A5A` range) — chrome, nav, headings, primary buttons
- `--color-accent` — subtle saffron (e.g. `#E8A33D`/`#F0A93C` range) — used sparingly: CTA highlights, active states, the one signature moment (e.g. the scroll roadmap's active stage)
- `--color-success` — green for positive eligibility states (ELIGIBLE, verified, matched criteria)
- `--color-warning` — amber for MANUAL_REVIEW / INSUFFICIENT_INFORMATION / pending-review states
- `--color-danger` — for INELIGIBLE / failed uploads / errors
- Neutral scale — off-white surface, soft gray borders/dividers — spacious, not dense

**Type:** a confident, modern display face for headings paired with a highly legible body face (system-native pairing is fine, e.g. an Inter/Söhne-style body with a slightly more characterful display weight for the hero) — avoid default browser serif/sans combos reading as untouched.

**Surfaces & motion:** rounded cards (consistent radius scale), soft layered shadows (not harsh drop-shadows), generous whitespace. Scroll-triggered reveals for the roadmap section, hover micro-interactions on cards/buttons, skeleton/loading states for every async fetch (workflow creation, document processing, eligibility evaluation — these have real backend latency, especially OCR/AI calls), and empty states that read as an invitation to act (e.g. "No schemes match yet — try describing your need differently") rather than a bare "no data."

**Accessibility & responsiveness:** visible keyboard focus states throughout, respect `prefers-reduced-motion`, fully responsive from mobile up — the citizen flow in particular must work cleanly on a phone since that's the realistic primary device for many beneficiaries.

**Trust cues appropriate to a government-adjacent service:** official-link buttons visually distinct (e.g. outlined + external-link icon) from in-app primary actions, clear "leaving this platform" framing when routing to `applicationLink`/`officialLink`, and a calm, plain-language voice in all status/error copy (no jargon like "500 Internal Server Error" surfaced to the citizen).

---

## 6. Integration & State Rules

- **No hardcoded scheme data** in any component that ships to production — all scheme content flows through the API client hitting `GET /api/schemes` (public) or `GET /api/admin/schemes` (moderator). Mock data may exist only in a `*.mock.ts` fixture used by an explicit dev/storybook mode, never imported by a real route.
- Treat `workflowId` as the spine of the citizen flow — store it in the URL (e.g. `/dashboard/workflow/:workflowId/...`) so any step is directly linkable/refreshable, not just component state.
- Every mutating call (create workflow, upload document, evaluate eligibility, select scheme, admin create/update/activate/verify/import) must show an explicit pending/loading state and a distinguishable error state — this pipeline has real multi-second AI/OCR latency, so optimistic UI without loading feedback will feel broken.
- Central enum maps (in `lib/`) for `WorkflowStatus`, `DocumentStatus`, `DocumentClassification`, and eligibility `status` values, so every badge/label in the UI derives from one source of truth instead of ad hoc string checks scattered across components.

---

## 7. Deliverable Expectations

Generate a working Vite + React + TypeScript project implementing the above: routing, the typed API layer against the exact contracts in Section 2, the public site, the citizen dashboard flow as a linked multi-step experience, the separate moderator interface, and the design system from Section 5 applied consistently. Include a `.env.example` with `VITE_API_BASE_URL=http://localhost:8080` and a short README section on running it against the existing Spring Boot backend (including the CORS/proxy note from Section 2).