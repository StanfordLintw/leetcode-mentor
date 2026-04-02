# Software Design Document (SDD)
# LeetCode Mentor

| Field        | Value                                  |
|--------------|----------------------------------------|
| Version      | 1.0                                    |
| Date         | 2026-04-01                             |
| Status       | Draft                                  |
| Project      | leetcode-mentor                        |
| Stack        | Next.js 16 · React 19 · PostgreSQL · Prisma v7 · Claude CLI · Judge0 CE |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Architecture](#2-system-architecture)
3. [Module Design](#3-module-design)
4. [API Specification](#4-api-specification)
5. [Database Design](#5-database-design)
6. [Data Flow](#6-data-flow)
7. [Security Considerations](#7-security-considerations)
8. [Testing Strategy](#8-testing-strategy)
9. [Deployment](#9-deployment)

---

## 1. Introduction

### 1.1 Purpose

This Software Design Document describes the architecture, module design, API contracts, data model, and operational characteristics of **LeetCode Mentor** — a full-stack web application that provides an AI-powered coding-interview practice environment. This document is intended for engineers maintaining or extending the system, technical leads conducting design reviews, and QA engineers designing test plans.

### 1.2 Scope

This document covers every production artefact inside the `leetcode-mentor` repository:

- The Next.js 16 App Router frontend (pages, layouts, components)
- Thirteen REST API routes implemented as Next.js Route Handlers
- Four library modules (`lib/`) for database access, AI orchestration, code execution, and utilities
- The PostgreSQL schema managed by Prisma v7 with the `PrismaPg` driver adapter
- Integration with two external services: Claude CLI (AI) and Judge0 CE (code execution)
- Testing infrastructure (Jest + Playwright)

The document does **not** cover authentication (planned future work), continuous deployment pipelines, or infrastructure provisioning beyond environment-variable requirements.

### 1.3 Intended Audience

| Audience | Relevant Sections |
|---|---|
| Backend engineers | 2, 3 (lib/), 4, 5, 6, 7 |
| Frontend engineers | 2, 3 (components/), 4, 6 |
| QA / test engineers | 4, 8 |
| DevOps / platform | 7, 9 |
| Product / tech lead | 1, 2, 6 |

### 1.4 System Overview

LeetCode Mentor is a self-hosted web application designed to replace the fragmented workflow of practising coding problems on LeetCode while seeking help from separate AI chatbots. It unifies:

1. **A problem bank** — a curated set of LeetCode-style problems stored in PostgreSQL, browseable and filterable by difficulty, category, and tags.
2. **An in-browser code editor** — Monaco Editor (the engine behind VS Code) with syntax highlighting for Python, JavaScript, TypeScript, Java, and C++.
3. **Real code execution** — user code is submitted to Judge0 CE via RapidAPI and tested against stored test cases. Actual runtime and memory metrics are returned.
4. **AI mentorship** — six distinct AI-powered features (progressive hints, code review, mock interview, whiteboard explanation evaluation, concept explainer, and study plan generator) all powered by the Claude CLI subprocess model.
5. **Progress analytics** — a dashboard showing solved counts by difficulty and category, a GitHub-style submission heatmap, streak tracking, and a detailed submission history.

The MVP ships without user authentication; all activity is attributed to a single "guest" user record. Authentication is explicitly planned for a future milestone.

### 1.5 Definitions and Acronyms

| Term | Definition |
|---|---|
| **SDD** | Software Design Document — this file |
| **TDD** | Test-Driven Development — writing tests before implementation |
| **MVP** | Minimum Viable Product — the current shipped feature set without authentication |
| **SSR** | Server-Side Rendering — HTML generated on the server per request |
| **CSR** | Client-Side Rendering — HTML rendered in the browser via React |
| **RSC** | React Server Component — Next.js component rendered exclusively on the server |
| **API Route** | Next.js Route Handler (`route.ts`) compiled to a serverless function |
| **App Router** | Next.js 13+ file-system routing convention under the `app/` directory |
| **Prisma** | TypeScript ORM used to interact with PostgreSQL |
| **PrismaPg** | Prisma driver adapter that uses the `pg` library for PostgreSQL connections |
| **Judge0 CE** | Open-source code execution engine exposed via RapidAPI |
| **Claude CLI** | Anthropic's official command-line interface for Claude, invoked as a subprocess |
| **JSONL** | Newline-delimited JSON — the format emitted by `claude --output-format stream-json` |
| **cuid** | Collision-resistant unique identifier — used as primary key type in Prisma models |
| **DS&A** | Data Structures and Algorithms |
| **FAANG** | Facebook/Meta, Apple, Amazon, Netflix, Google — major tech companies |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          BROWSER (React 19)                             │
│                                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ Home /   │  │ /problems    │  │ /dashboard │  │ /ai  (AI Mentor) │  │
│  │ (CSR)    │  │ /problems/   │  │ (CSR)      │  │ (CSR, streaming) │  │
│  │          │  │ [slug] (CSR) │  │            │  │                  │  │
│  └────┬─────┘  └──────┬───────┘  └─────┬──────┘  └────────┬─────────┘  │
│       │               │                │                  │             │
└───────┼───────────────┼────────────────┼──────────────────┼─────────────┘
        │  fetch()      │  fetch()       │  fetch()         │  fetch()
        ▼               ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 NEXT.JS 16 SERVER  (Node.js process)                    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     API Route Handlers                           │    │
│  │                                                                  │    │
│  │  /api/problems      /api/execute      /api/stats                │    │
│  │  /api/problems/[slug]  /api/submissions  /api/stats/detailed    │    │
│  │  /api/problems/random                                           │    │
│  │  /api/ai/hint  /api/ai/review  /api/ai/interview                │    │
│  │  /api/ai/whiteboard  /api/ai/explain  /api/ai/study-plan        │    │
│  └────┬──────────────────────────┬───────────────────────────┬─────┘    │
│       │                          │                           │           │
│  ┌────▼──────┐           ┌───────▼────────┐         ┌───────▼────────┐  │
│  │  lib/db   │           │  lib/claude.ts │         │ lib/judge0.ts  │  │
│  │ (Prisma   │           │  (Claude CLI   │         │ (Judge0 CE     │  │
│  │  + PrismaPg)          │   subprocess)  │         │  via RapidAPI) │  │
│  └────┬──────┘           └───────┬────────┘         └───────┬────────┘  │
│       │                          │                           │           │
└───────┼──────────────────────────┼───────────────────────────┼───────────┘
        │                          │                           │
        ▼                          ▼                           ▼
┌───────────────┐      ┌─────────────────────┐    ┌───────────────────────┐
│  PostgreSQL   │      │   claude (binary)   │    │  Judge0 CE RapidAPI   │
│  Database     │      │   subprocess        │    │  (HTTPS)              │
│               │      │   stdin/stdout pipe │    │                       │
│  Users        │      │   --output-format   │    │  POST /submissions    │
│  Problems     │      │   text | stream-json│    │  ?wait=true           │
│  Submissions  │      │                     │    │                       │
│  UserProgress │      │   No API key needed │    │  X-RapidAPI-Key header│
│  StudyPlans   │      │   (uses local auth) │    │                       │
└───────────────┘      └─────────────────────┘    └───────────────────────┘
```

### 2.2 Frontend: Next.js 16 App Router

The application uses the Next.js App Router (`app/` directory). Every page file that begins with `'use client'` is a Client Component and renders in the browser; pages without this directive would be Server Components, though in this MVP all pages are CSR.

#### SSR vs. CSR per Page

| Route | Directive | Rendering | Rationale |
|---|---|---|---|
| `app/layout.tsx` | (none — RSC) | SSR shell | Sets HTML/body, fonts, metadata; no interactivity needed |
| `app/page.tsx` | `'use client'` | CSR | Fetches stats on mount, has interactive random problem buttons |
| `app/problems/page.tsx` | `'use client'` | CSR | Search, filter selects, and pagination require client state |
| `app/problems/[slug]/page.tsx` | `'use client'` | CSR | Editor, test-case runner, AI hint panel are all interactive |
| `app/dashboard/page.tsx` | `'use client'` | CSR | Recharts, heatmap, and tabs require browser APIs |
| `app/ai/page.tsx` | `'use client'` | CSR | Streaming AI responses, multi-tab interface, conversation state |

All pages fetch data themselves via `fetch('/api/...')` calls on the client side, keeping API routes as the single source of truth.

#### Monaco Editor: SSR Disabled Dynamic Import

The Monaco Editor package (`@monaco-editor/react`) references browser-only globals (`window`, `document`). To prevent server-side rendering crashes, `CodeEditor.tsx` uses Next.js dynamic import with `ssr: false`:

```ts
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <EditorLoadingSpinner />,
})
```

This means the editor bundle is never included in the server-rendered HTML. A spinner is shown during the async load. This is the standard Next.js pattern for any browser-only heavy dependency.

### 2.3 Backend: API Routes as Serverless Functions

Next.js Route Handlers (`route.ts` files) in the `app/api/` directory compile to serverless function entry points. Each handler exports one or more HTTP-method functions (`GET`, `POST`, etc.) and is executed in a Node.js runtime.

Key properties of this approach:

- **No Express server** — each route file is its own isolated handler.
- **Shared module scope** — the Prisma singleton in `lib/db.ts` persists across requests within the same Node.js worker process (important for connection pooling).
- **Edge Runtime is not used** — all routes use the default Node.js runtime, which is required by Prisma, the `child_process` module (used by `lib/claude.ts`), and the `pg` package.

### 2.4 AI Layer: Claude CLI Subprocess Model

The most architecturally distinctive aspect of LeetCode Mentor is its AI integration. Rather than calling the Anthropic HTTP API directly (which would require storing and rotating an API key), the application invokes the **Claude CLI** (`claude`) as a child process using Node.js `child_process.spawn`.

**Why this approach?**

The Claude CLI handles authentication locally (using credentials stored by `claude login`). This means:
- No `ANTHROPIC_API_KEY` environment variable is required in the application.
- The API key is never stored in the codebase or `.env` file.
- Rotating credentials only requires `claude login` on the host machine.
- The trade-off is that Claude CLI must be installed and authenticated on the server; this makes fully serverless hosting (e.g., Vercel's default runtime) impractical without custom build steps.

**Invocation pattern:**

```
spawn('claude', ['-p', '--output-format', 'text'], {
  shell: false,           // no shell injection vector
  stdio: ['pipe', 'pipe', 'pipe'],
})
```

The prompt is written to the child's `stdin` (not passed as a command-line argument), which prevents shell injection and allows arbitrarily long prompts. The response is collected from `stdout`.

**Streaming variant:**

```
spawn('claude', ['-p', '--output-format', 'stream-json'], ...)
```

The `stream-json` format emits JSONL where each line is a JSON object. Lines with `type === 'content_block_delta'` carry text deltas. The handler parses these and enqueues them into a Web `ReadableStream`, which is returned directly as the HTTP response body. The browser reads this stream incrementally and appends characters to the UI in real time.

### 2.5 Database: PostgreSQL with Prisma v7 and PrismaPg Adapter

Prisma v7 introduced a breaking change in how it connects to databases: rather than using its own built-in connection logic, it now uses **driver adapters**. LeetCode Mentor uses `@prisma/adapter-pg` (the `PrismaPg` adapter backed by the `pg` npm package).

```ts
// lib/db.ts
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
return new PrismaClient({ adapter })
```

The `PrismaClient` is stored on `globalThis` in development to survive Next.js hot-module replacement without exhausting database connections:

```ts
const globalForPrisma = globalThis as unknown as { prisma: ... }
export const prisma = globalForPrisma.prisma || createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

The generated client is output to `app/generated/prisma/` (not `node_modules`) per the schema's `output` directive.

### 2.6 Code Execution: Judge0 CE via RapidAPI

Code execution uses [Judge0 Community Edition](https://judge0.com/) accessed through the RapidAPI marketplace. Submissions are made synchronously using the `?wait=true` query parameter, which blocks until execution completes and returns the result in a single HTTP response (no polling required).

Supported languages and their Judge0 language IDs:

| Language   | Judge0 ID |
|------------|-----------|
| Python     | 71        |
| JavaScript | 63        |
| TypeScript | 74        |
| Java       | 62        |
| C++        | 54        |

The `JUDGE0_API_KEY` environment variable must be set. It is read exclusively in `lib/judge0.ts` (server-side), never exposed to the browser.

### 2.7 Data Flow Diagram

```
USER ACTION: Click "Run Code"
        │
        ▼
┌────────────────────┐
│  Browser           │
│  CodeEditor value  │──── POST /api/execute ────────────────────────────────┐
│  + language        │     { code, language, testCases[] }                   │
│  + testCases[]     │                                                        │
└────────────────────┘                                                        │
                                                                              ▼
                                                               ┌─────────────────────────┐
                                                               │  /api/execute/route.ts  │
                                                               │  1. Validate body        │
                                                               │  2. Call runTests()      │
                                                               └──────────┬──────────────┘
                                                                          │
                                                               ┌──────────▼──────────────┐
                                                               │  lib/judge0.ts           │
                                                               │  runTests() calls        │
                                                               │  submitCode() for each   │
                                                               │  test case (parallel)    │
                                                               └──────────┬──────────────┘
                                                                          │
                                                               ┌──────────▼──────────────┐
                                                               │  Judge0 CE (RapidAPI)   │
                                                               │  POST /submissions       │
                                                               │  ?base64_encoded=false   │
                                                               │  &wait=true              │
                                                               │                         │
                                                               │  Returns: stdout, stderr │
                                                               │  status, time, memory    │
                                                               └──────────┬──────────────┘
                                                                          │
                                                               ┌──────────▼──────────────┐
                                                               │  Compare actual vs       │
                                                               │  expected output         │
                                                               │  Build TestResult[]      │
                                                               └──────────┬──────────────┘
                                                                          │
                          ┌────────────────────┐            ┌─────────────▼──────────────┐
                          │  Browser           │◄───────────│  JSON: { results: [...] }  │
                          │  TestCasePanel     │            └────────────────────────────┘
                          │  shows pass/fail   │
                          └────────────────────┘
```

---

## 3. Module Design

### 3.1 `lib/db.ts` — Prisma Singleton

**Purpose:** Provide a single, reused `PrismaClient` instance throughout the application, preventing connection pool exhaustion during Next.js development (hot-module replacement) and in serverless environments where multiple workers may spin up.

**Key design decisions:**
- Uses `PrismaPg` adapter (required by Prisma v7 when using native `pg`).
- `DATABASE_URL` is read from `process.env` at construction time.
- The singleton pattern stores the client on `globalThis` in non-production environments. In production, each worker creates one client that lives for the worker's lifetime.

**Exports:**

| Export | Type | Description |
|---|---|---|
| `prisma` | `PrismaClient` | The singleton database client |

**Inputs:** `process.env.DATABASE_URL` (connection string)

**Outputs:** A ready-to-use Prisma client that can be imported by any API route.

---

### 3.2 `lib/claude.ts` — Claude CLI Runner

**Purpose:** Encapsulate all AI interactions by spawning the `claude` CLI as a child process. Exposes six high-level functions, each constructing a carefully engineered prompt and returning either a plain string or a `ReadableStream`.

**Internal functions (not exported):**

| Function | Description |
|---|---|
| `runClaude(prompt)` | Spawns `claude -p --output-format text`, writes prompt to stdin, resolves with stdout string |
| `streamClaude(prompt)` | Spawns `claude -p --output-format stream-json`, parses JSONL deltas, returns `ReadableStream<Uint8Array>` |
| `formatProblem(p)` | Formats a `ProblemContext` into a structured text block for inclusion in prompts |
| `buildPrompt(system, user)` | Concatenates a system prompt with a user message, separated by `---` |

**System prompts defined as constants:**

| Constant | Persona |
|---|---|
| `MENTOR_SYSTEM` | Elite LeetCode mentor — Socratic questioning, builds intuition |
| `INTERVIEWER_SYSTEM` | Senior engineer conducting a structured technical interview |

**Exported types:**

| Type | Fields |
|---|---|
| `ProblemContext` | `id, title, slug, difficulty, category, description, examples?, constraints?, hints?, tags?, timeComplexity?, spaceComplexity?` |
| `Message` | `role: 'user' \| 'assistant', content: string` |
| `CodeReview` | `score, timeComplexity, spaceComplexity, feedback, improvements[], isOptimal` |
| `WhiteboardFeedback` | `score, correctApproach, feedback, missingPoints[], suggestions[]` |
| `StudyPlanItem` | `day, problemSlugs[], focus, goal` |

**Exported functions:**

| Function | Inputs | Output | Mode |
|---|---|---|---|
| `getHint` | `problem, hintLevel (1\|2\|3), currentCode` | `Promise<string>` | Blocking |
| `reviewCode` | `problem, code, language` | `Promise<CodeReview>` | Blocking |
| `askInterviewQuestion` | `problem, stage, conversationHistory` | `Promise<string>` | Blocking |
| `askInterviewQuestionStream` | `problem, stage, conversationHistory` | `ReadableStream<Uint8Array>` | Streaming |
| `evaluateWhiteboardExplanation` | `problem, explanation` | `Promise<WhiteboardFeedback>` | Blocking |
| `generateStudyPlan` | `weakCategories, targetDays, currentLevel` | `Promise<StudyPlanItem[]>` | Blocking |
| `explainConcept` | `concept, level` | `Promise<string>` | Blocking |
| `explainConceptStream` | `concept, level` | `ReadableStream<Uint8Array>` | Streaming |

Note: `explainConcept` (blocking) and `explainConceptStream` (streaming) are both exported; API routes use the streaming version for real-time UI updates.

**Hint level guidelines baked into `getHint`:**

| Level | Guideline |
|---|---|
| 1 | Very gentle nudge — general category only, no algorithm names, 2–3 sentences |
| 2 | Specific hint — name the data structure or pattern and explain why, 3–4 sentences |
| 3 | Concrete hint — high-level approach with key steps, time/space complexity, 4–6 sentences |

**JSON extraction pattern:** For functions expecting structured JSON output (`reviewCode`, `evaluateWhiteboardExplanation`, `generateStudyPlan`), the prompt instructs Claude to respond with raw JSON (no markdown fences). The response is cleaned by stripping accidental fences, then parsed. A fallback object is returned if parsing fails.

---

### 3.3 `lib/judge0.ts` — Judge0 API Client

**Purpose:** Submit code to the Judge0 CE API for execution and compare results against expected outputs.

**Exports:**

| Export | Type | Description |
|---|---|---|
| `Judge0Result` | interface | Raw API response shape: `stdout, stderr, status, time, memory` |
| `TestCase` | interface | `{ input: string, expected: string }` |
| `TestResult` | interface | `{ passed, input, expected, actual, time, memory }` |
| `submitCode` | function | Submit code with optional stdin, return `Judge0Result` |
| `runTests` | function | Run all test cases in parallel, return `TestResult[]` |

**`submitCode(code, language, stdin?)` — inputs and outputs:**

| Parameter | Type | Description |
|---|---|---|
| `code` | `string` | Source code to execute |
| `language` | `string` | One of `python`, `javascript`, `typescript`, `java`, `cpp` |
| `stdin` | `string?` | Standard input for the program |

Returns `Judge0Result` with execution metrics. Throws if the language is unsupported or if `JUDGE0_API_KEY` is not set.

**`runTests(code, language, testCases[])` — behaviour:**

All test cases are executed in **parallel** via `Promise.all`. For each test case, `submitCode` is called with `testCase.input` as stdin. A test case passes if and only if:
1. Judge0 returns status ID `3` (Accepted — no runtime error, no TLE), AND
2. The trimmed `stdout` matches the trimmed `expected` string exactly.

Individual test case errors are caught and returned as a `TestResult` with `passed: false` and an error message in `actual`.

---

### 3.4 `lib/utils.ts` — Utility Helpers

**Purpose:** Provide a single `cn()` helper used throughout components for conditional Tailwind class merging.

**Exports:**

| Export | Description |
|---|---|
| `cn(...inputs: ClassValue[])` | Merges class names using `clsx` (conditionals) then `tailwind-merge` (deduplication of conflicting Tailwind classes) |

Example usage: `cn('bg-zinc-900', isActive && 'bg-zinc-700', className)`

---

### 3.5 `components/editor/`

#### `CodeEditor.tsx`

**Purpose:** Render a Monaco Editor instance for code input, with SSR safely disabled.

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `code` | `string` | — | Controlled value |
| `language` | `string` | — | Programming language key |
| `onChange` | `(code: string) => void` | — | Called on every edit |
| `readOnly` | `boolean` | `false` | Disables editing |
| `height` | `string` | `'400px'` | CSS height |

Monaco options configured: `fontSize: 14`, `fontFamily: 'JetBrains Mono, Fira Code, monospace'`, `fontLigatures: true`, `minimap: disabled`, `wordWrap: on`, `automaticLayout: true`. Theme is `vs-dark`.

Language mapping: `python → python`, `javascript → javascript`, `typescript → typescript`, `java → java`, `cpp → cpp`.

#### `LanguageSelector.tsx`

**Purpose:** Radix UI `Select` component for choosing the active programming language.

**Props:** `value: string`, `onChange: (lang: string) => void`

Supported languages rendered: Python, JavaScript, TypeScript, Java, C++ (with icon characters).

#### `TestCasePanel.tsx`

**Purpose:** Tabbed panel showing test case inputs/expected outputs, and execution results.

**Props:**

| Prop | Type | Description |
|---|---|---|
| `testCases` | `TestCase[]` | Problem's test cases |
| `results` | `TestResult[]?` | Results from the last run |
| `isRunning` | `boolean` | Shows spinner when executing |

Two tabs: "Test Cases" (static problem data) and "Results" (dynamic execution output). The results tab header shows a `passed/total` badge coloured green or red. Each result row shows input, expected, actual, time, and memory.

---

### 3.6 `components/problems/`

#### `ProblemRow.tsx`

**Purpose:** A single table row in the problem list, linking to `/problems/[slug]`.

**Props:** `id, title, slug, difficulty, category, tags[], leetcodeId, acceptance?, solved?`

Renders: LeetCode number, problem title (link), category badge, difficulty badge, acceptance percentage, up to 3 tag chips (plus count overflow), and a checkmark icon if solved.

#### `DifficultyBadge.tsx`

**Purpose:** Coloured pill showing EASY (green), MEDIUM (yellow), or HARD (red).

#### `CategoryBadge.tsx`

**Purpose:** Displays the problem's category enum value in a human-readable form with optional icon.

---

### 3.7 `components/dashboard/`

#### `StatsCard.tsx`

**Purpose:** Metric card with a title, large numeric value, optional subtitle, and an optional Lucide icon with colour theming.

**Props:** `title, value, subtitle?, icon?, color?`

Colour options: `green`, `yellow`, `red`, `blue`, `purple`, `default`. Each colour maps to both a text class for the value and a background class for the icon container.

#### `SubmissionHeatmap.tsx`

**Purpose:** GitHub contribution graph-style heatmap of submission activity over the last 365 days.

**Props:** `data: { date: string, count: number }[]`

Implementation: Builds a 52–53 column × 7 row grid of `div` cells aligned to calendar weeks (columns) and days (rows). Each cell's colour intensity maps to submission count. Hovering shows a tooltip with the exact date and count. Month labels are computed by finding the first column belonging to each month.

Cell colour scale:

| Count | Class |
|---|---|
| 0 | `bg-zinc-800` |
| 1–2 | `bg-green-900` |
| 3–5 | `bg-green-700` |
| 6+ | `bg-green-500` |

#### `CategoryProgress.tsx`

**Purpose:** Two-column grid of progress bars, one per problem category, showing solved vs. total.

Bar colour thresholds: 80%+ green, 50%+ yellow, 20%+ orange, below 20% red.

---

### 3.8 `components/ai/`

#### `ChatMessage.tsx`

**Purpose:** A single chat bubble in the AI mentor conversation. User messages appear right-aligned in blue; assistant messages appear left-aligned in dark zinc. When `isStreaming` is true on an assistant message, renders `StreamingText` with the blinking cursor.

**Props:** `role: 'user' | 'assistant'`, `content: string`, `isStreaming?: boolean`

#### `StreamingText.tsx`

**Purpose:** Renders text with a blinking cursor appended, used while streaming AI responses incrementally.

**Props:** `text: string`, `showCursor?: boolean`, `className?: string`

The cursor is a 2px-wide inline block that toggles opacity at 530ms intervals via `setInterval`. The interval is cleaned up on unmount.

---

## 4. API Specification

All routes are under the base URL `/api`. All requests and responses use `application/json` unless noted. Error responses always have the shape `{ "error": "<message>" }`.

Streaming routes (`/api/ai/interview`, `/api/ai/explain`) return `text/plain; charset=utf-8` with `Transfer-Encoding: chunked` and must be consumed via `fetch` + `ReadableStream` on the client.

---

### 4.1 `GET /api/problems`

Fetch a paginated, filtered list of problems.

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number (1-indexed) |
| `limit` | integer | `20` | Results per page (max 100) |
| `difficulty` | `EASY\|MEDIUM\|HARD\|ALL` | (all) | Filter by difficulty |
| `category` | `ARRAY\|STRING\|...` | (all) | Filter by category enum value |
| `search` | string | (none) | Case-insensitive search on title and tags |

**Response `200 OK`:**

```json
{
  "problems": [
    {
      "id": "clxxx...",
      "title": "Two Sum",
      "slug": "two-sum",
      "difficulty": "EASY",
      "category": "ARRAY",
      "tags": ["Array", "Hash Table"],
      "leetcodeId": 1
    }
  ],
  "total": 150,
  "page": 1,
  "totalPages": 8
}
```

**Error Codes:** `500` — database error.

---

### 4.2 `GET /api/problems/[slug]`

Fetch a single problem by its URL slug, including all fields.

**Path Parameters:** `slug` — the problem's unique slug (e.g., `two-sum`).

**Response `200 OK`:**

Full `Problem` object including: `id, title, slug, difficulty, category, description, examples (JSON), constraints[], hints[], tags[], starterCode (JSON), solution?, timeComplexity?, spaceComplexity?, leetcodeId?, createdAt`.

**Error Codes:**
- `404` — problem not found
- `500` — database error

---

### 4.3 `GET /api/problems/random`

Fetch a random unsolved problem, optionally filtered by difficulty.

**Query Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `difficulty` | `EASY\|MEDIUM\|HARD` | No | Filter by difficulty |
| `userId` | string | No | User ID (defaults to `'guest'`) to exclude already-solved problems |

**Response `200 OK`:**

```json
{
  "problem": {
    "id": "clxxx...",
    "title": "Maximum Subarray",
    "slug": "maximum-subarray",
    "difficulty": "MEDIUM",
    "category": "ARRAY"
  }
}
```

**Error Codes:**
- `400` — invalid difficulty value
- `404` — no unsolved problems found matching the criteria
- `500` — database error

---

### 4.4 `POST /api/execute`

Execute code against test cases using Judge0 CE.

**Request Body:**

```json
{
  "code": "def twoSum(nums, target): ...",
  "language": "python",
  "testCases": [
    { "input": "[2,7,11,15]\n9", "expected": "[0,1]" }
  ]
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `code` | string | Yes | Non-empty string |
| `language` | string | Yes | One of `python`, `javascript`, `typescript`, `java`, `cpp` |
| `testCases` | array | Yes | Array of `{ input: string, expected: string }` |

**Response `200 OK`:**

```json
{
  "results": [
    {
      "passed": true,
      "input": "[2,7,11,15]\n9",
      "expected": "[0,1]",
      "actual": "[0,1]",
      "time": "0.012",
      "memory": 9216
    }
  ]
}
```

**Error Codes:**
- `400` — missing/invalid fields
- `502` — Judge0 API error (upstream failure)

---

### 4.5 `POST /api/submissions`

Record a submission in the database.

**Request Body:**

```json
{
  "problemId": "clxxx...",
  "code": "def twoSum...",
  "language": "python",
  "userId": "guest",
  "status": "ACCEPTED"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `problemId` | string | Yes | Problem's cuid |
| `code` | string | Yes | Submitted source code |
| `language` | string | Yes | Programming language |
| `userId` | string | No | Defaults to `'guest'` |
| `status` | `SubmissionStatus` | No | Defaults to `'WRONG_ANSWER'` |

When `userId === 'guest'`, an upsert ensures a guest user record exists (`email: 'guest@leetcode-mentor.local'`).

**Response `201 Created`:**

Full `Submission` object with nested `problem: { title, slug, difficulty }`.

**Error Codes:**
- `400` — missing required fields
- `500` — database error

---

### 4.6 `GET /api/submissions`

Fetch submission history with optional filters.

**Query Parameters:**

| Parameter | Description |
|---|---|
| `userId` | Filter by user ID |
| `problemId` | Filter by problem ID |
| `limit` | Max results (default 20, max 50) |

**Response `200 OK`:** Array of `Submission` objects with nested `problem: { title, slug, difficulty }`, ordered by `createdAt DESC`.

**Error Codes:** `500` — database error.

---

### 4.7 `GET /api/stats`

Aggregate dashboard statistics for a user.

**Query Parameters:** `userId` (defaults to `'guest'`)

**Response `200 OK`:**

```json
{
  "totalSolved": 42,
  "easySolved": 20,
  "mediumSolved": 18,
  "hardSolved": 4,
  "categoryStats": [
    { "category": "ARRAY", "solved": 12, "total": 30 }
  ],
  "recentSubmissions": [
    {
      "id": "...",
      "problemTitle": "Two Sum",
      "problemSlug": "two-sum",
      "difficulty": "EASY",
      "language": "python",
      "status": "ACCEPTED",
      "runtime": null,
      "memory": null,
      "createdAt": "2026-04-01T10:00:00.000Z"
    }
  ],
  "streak": { "current": 7, "longest": 14 },
  "recommended": [
    { "id": "...", "title": "...", "slug": "...", "difficulty": "MEDIUM", "category": "ARRAY" }
  ]
}
```

Streak is calculated from unique calendar days with at least one ACCEPTED submission. The current streak counts consecutive days ending today or yesterday.

**Error Codes:** `500` — database error.

---

### 4.8 `GET /api/stats/detailed`

Extended analytics for the dashboard page.

**Query Parameters:** `userId` (defaults to `'guest'`)

**Response `200 OK`:**

```json
{
  "heatmapData": [{ "date": "2026-03-15", "count": 5 }],
  "languageStats": [{ "language": "python", "count": 30 }],
  "submissionHistory": [ /* last 100 submissions, full detail */ ],
  "difficultyBreakdown": { "EASY": 20, "MEDIUM": 18, "HARD": 4 },
  "categoryStats": [{ "category": "ARRAY", "count": 12 }],
  "habitTracker": {
    "daysPracticed": 45,
    "currentStreak": 7,
    "longestStreak": 14
  }
}
```

`heatmapData` covers the last 365 days (since `today - 364`). `languageStats` is ordered by count descending.

**Error Codes:** `500` — database error.

---

### 4.9 `POST /api/ai/hint`

Get a progressive hint for a problem without revealing the solution.

**Request Body:**

```json
{
  "problemId": "clxxx...",
  "hintLevel": 2,
  "code": "def twoSum(nums, target):\n    pass",
  "problem": { /* optional ProblemContext */ }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `hintLevel` | `1 \| 2 \| 3` | Yes | Hint specificity (1=gentle, 3=concrete) |
| `code` | string | Yes | Student's current code |
| `problem` | `ProblemContext` | No | If omitted, a minimal fallback is used |

**Response `200 OK`:**

```json
{ "hint": "Consider thinking about what data structure allows O(1) lookups..." }
```

**Error Codes:**
- `400` — missing hintLevel or invalid hintLevel value
- `500` — Claude CLI error

---

### 4.10 `POST /api/ai/review`

Request a structured code review scored 0–100.

**Request Body:**

```json
{
  "problemId": "clxxx...",
  "code": "def twoSum(nums, target): ...",
  "language": "python",
  "problem": { /* optional ProblemContext */ }
}
```

**Response `200 OK`:** A `CodeReview` object:

```json
{
  "score": 88,
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(n)",
  "feedback": "Clean, efficient solution using a hash map...",
  "improvements": ["Consider adding type hints", "Handle empty array edge case"],
  "isOptimal": true
}
```

**Error Codes:**
- `400` — missing code or language
- `500` — Claude CLI error

---

### 4.11 `POST /api/ai/interview`

Run a mock technical interview session with streaming response.

**Request Body:**

```json
{
  "problemId": "clxxx...",
  "stage": "approach",
  "conversationHistory": [
    { "role": "user", "content": "I think we should use a hash map..." }
  ],
  "problem": { /* optional ProblemContext */ }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `stage` | `clarification\|approach\|coding\|analysis` | Yes | Current interview phase |
| `conversationHistory` | `Message[]` | Yes | Full conversation so far |

**Response:** `200 OK` with `Content-Type: text/plain; charset=utf-8`, streamed. The response body is the interviewer's next message delivered incrementally as text chunks.

**Error Codes:**
- `400` — missing stage or invalid stage value
- `500` — Claude CLI error (returned as JSON)

---

### 4.12 `POST /api/ai/whiteboard`

Evaluate a candidate's verbal problem explanation (no code).

**Request Body:**

```json
{
  "problemId": "clxxx...",
  "explanation": "I would use a two-pointer approach starting from both ends...",
  "problem": { /* optional ProblemContext */ }
}
```

| Field | Validation |
|---|---|
| `explanation` | Must be at least 10 characters |

**Response `200 OK`:** A `WhiteboardFeedback` object:

```json
{
  "score": 75,
  "correctApproach": true,
  "feedback": "You correctly identified the two-pointer technique...",
  "missingPoints": ["Did not mention time complexity", "Edge case: empty array"],
  "suggestions": ["Practice stating complexity upfront", "Always handle base cases verbally"]
}
```

**Error Codes:**
- `400` — explanation too short
- `500` — Claude CLI error

---

### 4.13 `POST /api/ai/explain`

Get a structured concept explanation with streaming response.

**Request Body:**

```json
{
  "concept": "sliding window",
  "level": "intermediate"
}
```

| Field | Validation |
|---|---|
| `concept` | Non-empty string |
| `level` | One of `beginner`, `intermediate`, `advanced` |

**Response:** `200 OK` streamed text — a Markdown-formatted explanation covering: definition, relevance, mechanics with example, key patterns, common pitfalls, and 3–5 practice problems.

**Error Codes:**
- `400` — missing concept or invalid level
- `500` — Claude CLI error

---

### 4.14 `POST /api/ai/study-plan`

Generate a personalised multi-day study plan.

**Request Body:**

```json
{
  "weakCategories": ["DYNAMIC_PROGRAMMING", "GRAPH"],
  "targetDays": 30,
  "currentLevel": "intermediate"
}
```

| Field | Validation |
|---|---|
| `weakCategories` | Non-empty array of category strings |
| `targetDays` | Integer between 1 and 365 |
| `currentLevel` | One of `beginner`, `intermediate`, `advanced` |

**Response `200 OK`:** Array of `StudyPlanItem`:

```json
[
  {
    "day": 1,
    "problemSlugs": ["climbing-stairs", "coin-change"],
    "focus": "Dynamic Programming Fundamentals",
    "goal": "Understand memoization vs tabulation, solve basic 1D DP"
  }
]
```

**Error Codes:**
- `400` — invalid weakCategories, targetDays out of range, or invalid currentLevel
- `500` — Claude CLI error or JSON parse failure

---

## 5. Database Design

### 5.1 Entity-Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│    ┌────────────────┐          ┌─────────────────────────────────┐      │
│    │     User       │          │           Problem                │      │
│    ├────────────────┤          ├─────────────────────────────────┤      │
│    │ id (PK, cuid)  │          │ id (PK, cuid)                   │      │
│    │ email (UNIQUE) │          │ title                           │      │
│    │ name?          │          │ slug (UNIQUE)                   │      │
│    │ createdAt      │          │ difficulty (Difficulty enum)    │      │
│    └───────┬────────┘          │ category (Category enum)        │      │
│            │                  │ description                     │      │
│            │ 1                │ examples (Json)                 │      │
│            ├──────────────────│ constraints (String[])          │      │
│            │ *                │ hints (String[])                │      │
│    ┌───────▼────────┐         │ tags (String[])                 │      │
│    │   Submission   │         │ starterCode (Json)              │      │
│    ├────────────────┤         │ solution?                       │      │
│    │ id (PK, cuid)  │         │ timeComplexity?                 │      │
│    │ userId (FK)    │    *    │ spaceComplexity?                │      │
│    │ problemId (FK) ├─────────│ leetcodeId? (UNIQUE)            │      │
│    │ code           │         │ createdAt                       │      │
│    │ language       │         └─────────────┬───────────────────┘      │
│    │ status (enum)  │                       │                           │
│    │ runtime?       │                       │ 1                         │
│    │ memory?        │                       ├───────────────────────────┤
│    │ createdAt      │                       │ *                         │
│    └────────────────┘              ┌────────▼──────────────┐           │
│                                    │    UserProgress        │           │
│    ┌────────────────┐              ├───────────────────────┤           │
│    │   StudyPlan    │              │ id (PK, cuid)         │           │
│    ├────────────────┤         *    │ userId (FK)           │           │
│    │ id (PK, cuid)  │◄────────────│ problemId (FK)        │           │
│    │ userId (FK)    │              │ solved (bool)         │           │
│    │ name           │              │ attempts (int)        │           │
│    │ problems (Json)│              │ lastAttempt?          │           │
│    │ targetDate?    │              │ notes?                │           │
│    │ createdAt      │              │ UNIQUE(userId,        │           │
│    └────────────────┘              │   problemId)          │           │
│                                    └───────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Model: `User`

| Field | Type | Constraint | Description |
|---|---|---|---|
| `id` | `String` | PK, `@default(cuid())` | Unique identifier |
| `email` | `String` | `@unique` | User's email address |
| `name` | `String?` | Optional | Display name |
| `createdAt` | `DateTime` | `@default(now())` | Account creation timestamp |

**Relations:**
- `submissions` — one-to-many with `Submission`
- `progress` — one-to-many with `UserProgress`
- `studyPlans` — one-to-many with `StudyPlan`

---

### 5.3 Model: `Problem`

| Field | Type | Constraint | Description |
|---|---|---|---|
| `id` | `String` | PK, `@default(cuid())` | Unique identifier |
| `title` | `String` | — | Problem title |
| `slug` | `String` | `@unique` | URL-friendly identifier (e.g., `two-sum`) |
| `difficulty` | `Difficulty` | enum | EASY, MEDIUM, or HARD |
| `category` | `Category` | enum | See Category enum below |
| `description` | `String` | — | Problem statement (markdown) |
| `examples` | `Json` | — | Array of `{ input, output, explanation }` objects |
| `constraints` | `String[]` | — | List of constraint strings |
| `hints` | `String[]` | — | Progressive hints |
| `tags` | `String[]` | — | Topic tags (e.g., `["Array", "Hash Table"]`) |
| `starterCode` | `Json` | — | Object keyed by language with starter templates |
| `solution` | `String?` | Optional | Reference solution with explanation |
| `timeComplexity` | `String?` | Optional | Expected time complexity (e.g., `O(n)`) |
| `spaceComplexity` | `String?` | Optional | Expected space complexity |
| `leetcodeId` | `Int?` | `@unique`, Optional | Original LeetCode problem number |
| `createdAt` | `DateTime` | `@default(now())` | Record creation timestamp |

---

### 5.4 Model: `Submission`

| Field | Type | Constraint | Description |
|---|---|---|---|
| `id` | `String` | PK, `@default(cuid())` | Unique identifier |
| `userId` | `String` | FK → `User.id` | Owner |
| `problemId` | `String` | FK → `Problem.id` | Problem attempted |
| `code` | `String` | — | Submitted source code |
| `language` | `String` | — | Programming language |
| `status` | `SubmissionStatus` | enum | Outcome |
| `runtime` | `Int?` | Optional | Execution time in milliseconds |
| `memory` | `Int?` | Optional | Memory usage in kilobytes |
| `createdAt` | `DateTime` | `@default(now())` | Submission timestamp |

**Cascade delete:** Deleting a `User` or `Problem` cascades to delete their `Submission` records.

---

### 5.5 Model: `UserProgress`

| Field | Type | Constraint | Description |
|---|---|---|---|
| `id` | `String` | PK, `@default(cuid())` | Unique identifier |
| `userId` | `String` | FK → `User.id` | Owner |
| `problemId` | `String` | FK → `Problem.id` | Problem being tracked |
| `solved` | `Boolean` | `@default(false)` | Whether the problem has been solved |
| `attempts` | `Int` | `@default(0)` | Total attempt count |
| `lastAttempt` | `DateTime?` | Optional | Timestamp of most recent attempt |
| `notes` | `String?` | Optional | User's personal notes |

**Unique constraint:** `@@unique([userId, problemId])` — one progress record per user per problem.

---

### 5.6 Model: `StudyPlan`

| Field | Type | Constraint | Description |
|---|---|---|---|
| `id` | `String` | PK, `@default(cuid())` | Unique identifier |
| `userId` | `String` | FK → `User.id` | Owner |
| `name` | `String` | — | Plan name |
| `problems` | `Json` | — | Serialised `StudyPlanItem[]` array |
| `targetDate` | `DateTime?` | Optional | Completion goal date |
| `createdAt` | `DateTime` | `@default(now())` | Plan creation timestamp |

---

### 5.7 Enum: `Difficulty`

| Value | Description |
|---|---|
| `EASY` | Beginner-level problems |
| `MEDIUM` | Intermediate problems |
| `HARD` | Advanced problems |

### 5.8 Enum: `Category`

| Value | Human Label |
|---|---|
| `ARRAY` | Array |
| `STRING` | String |
| `LINKED_LIST` | Linked List |
| `TREE` | Tree |
| `GRAPH` | Graph |
| `DYNAMIC_PROGRAMMING` | Dynamic Programming |
| `BACKTRACKING` | Backtracking |
| `BINARY_SEARCH` | Binary Search |
| `STACK_QUEUE` | Stack / Queue |
| `HASH_TABLE` | Hash Table |
| `MATH` | Math |
| `TWO_POINTERS` | Two Pointers |
| `SLIDING_WINDOW` | Sliding Window |
| `GREEDY` | Greedy |
| `HEAP` | Heap |
| `TRIE` | Trie |

### 5.9 Enum: `SubmissionStatus`

| Value | Description |
|---|---|
| `ACCEPTED` | All test cases passed |
| `WRONG_ANSWER` | One or more test cases produced incorrect output |
| `TIME_LIMIT` | Execution exceeded the time limit |
| `RUNTIME_ERROR` | Code raised an exception or crashed |
| `COMPILE_ERROR` | Code failed to compile |

### 5.10 Indexes and Unique Constraints

| Model | Field(s) | Constraint |
|---|---|---|
| `User` | `email` | `@unique` |
| `Problem` | `slug` | `@unique` |
| `Problem` | `leetcodeId` | `@unique` (nullable) |
| `UserProgress` | `(userId, problemId)` | `@@unique` |

All primary keys are automatically indexed. Foreign key fields (`userId`, `problemId`) are indexed by Prisma/PostgreSQL by convention. No explicit `@@index` directives are defined in the current schema; adding indexes on `Submission.userId`, `Submission.createdAt`, and `Submission.status` would benefit the stats aggregation queries at scale.

---

## 6. Data Flow

### 6.1 User Solves a Problem

This describes the complete flow from a user writing code to a submission being recorded.

```
Step 1: Page Load
─────────────────
Browser navigates to /problems/two-sum
  └─► app/problems/[slug]/page.tsx ('use client')
        └─► useEffect: fetch('/api/problems/two-sum')
              └─► GET /api/problems/[slug]/route.ts
                    └─► db.problem.findUnique({ where: { slug } })
                          └─► PostgreSQL returns full Problem record
                    └─► Response.json(problem) → 200
              └─► Page renders: description panel + CodeEditor + TestCasePanel

Step 2: User Writes Code
─────────────────────────
Monaco Editor renders with starterCode[language]
User types solution → onChange callback → local state update

Step 3: Run Code (test against sample cases)
────────────────────────────────────────────
User clicks "Run Code"
  └─► Browser: POST /api/execute
        body: { code, language, testCases: problem.examples }
  └─► /api/execute/route.ts
        └─► Validate body (code non-empty, language valid, testCases array)
        └─► runTests(code, language, testCases)   ← lib/judge0.ts
              └─► Promise.all([
                    submitCode(code, language, testCases[0].input),
                    submitCode(code, language, testCases[1].input),
                    ...
                  ])
              └─► Each submitCode:
                    POST https://judge0-ce.p.rapidapi.com/submissions?wait=true
                    Headers: X-RapidAPI-Key: $JUDGE0_API_KEY
                    Body: { source_code, language_id, stdin }
                    ──────────────────────────────────────────────
                    Judge0 executes code in sandbox
                    Returns: { stdout, stderr, status, time, memory }
                    ──────────────────────────────────────────────
                    Compare stdout.trim() === expected.trim()
                    → TestResult { passed, input, expected, actual, time, memory }
              └─► return TestResult[]
        └─► Response.json({ results })   → 200

  └─► Browser: TestCasePanel switches to "Results" tab
        Shows: pass/fail per case, time, memory

Step 4: Submit (if all tests pass)
────────────────────────────────────
User clicks "Submit"
  └─► Browser: POST /api/submissions
        body: { problemId, code, language, userId: 'guest', status: 'ACCEPTED' }
  └─► /api/submissions/route.ts
        └─► Upsert guest user if needed
        └─► db.submission.create({ data: { ... } })
        └─► Response.json(submission, { status: 201 })

  └─► Browser: optionally update UserProgress (future: via separate call)
```

### 6.2 AI Hint Flow

```
User clicks "Get Hint (Level 2)"
  └─► Browser: POST /api/ai/hint
        body: {
          problemId: "clxxx...",
          hintLevel: 2,
          code: "def twoSum(nums, target):\n    pass",
          problem: { id, title, slug, difficulty, category, description, ... }
        }

  └─► /api/ai/hint/route.ts
        └─► Validate hintLevel (1-3)
        └─► Build ProblemContext (from body.problem or fallback)
        └─► getHint(problemContext, 2, code)   ← lib/claude.ts

              getHint():
              ──────────
              Build guidelines string for level 2:
                "Specific hint — mention the data structure or algorithmic
                 pattern. Explain WHY it is relevant. 3-4 sentences."

              Build userMessage:
                "Problem: Two Sum (EASY)\nCategory: ARRAY\n..."
                + "\n\nStudent's current code:\n```\ndef twoSum...\n```"
                + "\n\nStudent requested hint level 2/3.\nGuideline: ..."

              buildPrompt(MENTOR_SYSTEM, userMessage)
                → "You are an elite LeetCode mentor...\n\n---\n\n<userMessage>"

              runClaude(prompt):
              ──────────────────
              spawn('claude', ['-p', '--output-format', 'text'], {
                shell: false,
                stdio: ['pipe', 'pipe', 'pipe']
              })
              child.stdin.write(prompt)
              child.stdin.end()
              ──────────────────────────────────────────────────────────
              Claude CLI reads prompt from stdin
              Claude CLI calls Anthropic API using local credentials
              Claude generates contextually-aware hint
              Writes response to stdout
              Process exits with code 0
              ──────────────────────────────────────────────────────────
              Collect stdout → return trimmed string

        └─► NextResponse.json({ hint: "Consider what happens when you..." })

  └─► Browser: render hint text in hint panel
```

### 6.3 Interview Mode Streaming Flow

```
User enters Interview Mode, stage: "approach"
  └─► Browser: POST /api/ai/interview
        body: {
          problemId: "clxxx...",
          stage: "approach",
          conversationHistory: [
            { role: 'user', content: "I think a hash map might work..." }
          ],
          problem: { ... }
        }

  └─► /api/ai/interview/route.ts
        └─► Validate stage
        └─► askInterviewQuestionStream(problem, 'approach', history)
              ↓
              lib/claude.ts: streamClaude(prompt)
              ──────────────────────────────────────
              spawn('claude', ['-p', '--output-format', 'stream-json'], {
                shell: false, stdio: ['pipe', 'pipe', 'pipe']
              })
              child.stdin.write(prompt)
              child.stdin.end()

              return new ReadableStream({
                start(controller) {
                  child.stdout.on('data', chunk => {
                    buffer += chunk.toString()
                    split on '\n', parse each line as JSON
                    if line.type === 'content_block_delta' &&
                       line.delta.type === 'text_delta':
                      controller.enqueue(encoder.encode(line.delta.text))
                  })
                  child.on('close', () => controller.close())
                }
              })
              ──────────────────────────────────────

        └─► return new Response(readable, {
              headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'Cache-Control': 'no-cache'
              }
            })

  ──────────────────── HTTP stream begins ─────────────────────────────────

  Browser reads response body as ReadableStream:
    reader = response.body.getReader()
    decoder = new TextDecoder()
    while (true) {
      { done, value } = await reader.read()
      if done break
      partial_text += decoder.decode(value)
      setStreamingContent(partial_text)  // React state update → re-render
    }

  ChatMessage component: isStreaming=true → StreamingText shows cursor
  Text appears character-by-character as Claude generates it
  On stream end: cursor stops blinking, message marked complete
```

---

## 7. Security Considerations

### 7.1 Secret Management

| Secret | Location | Exposure |
|---|---|---|
| `DATABASE_URL` | `.env` (gitignored) | Server-side only; never sent to browser |
| `JUDGE0_API_KEY` | `.env` (gitignored) | Read in `lib/judge0.ts` (server-side); never referenced in client components |
| Anthropic credentials | Claude CLI local config (`claude login`) | Never stored in the repository; not in any environment variable |

The `.env` file is gitignored. No secrets appear in the source code. All sensitive reads happen in `lib/` modules or API routes, which are Node.js server-side code and never bundled into client JavaScript.

### 7.2 Judge0 API Key Isolation

`JUDGE0_API_KEY` is read exclusively in `lib/judge0.ts`:

```ts
const apiKey = process.env.JUDGE0_API_KEY
if (!apiKey) throw new Error('JUDGE0_API_KEY environment variable is not set')
```

This module is imported only by API routes. Next.js will never include server-only modules in the browser bundle. If someone were to incorrectly import `lib/judge0.ts` in a client component, Next.js would throw a build-time error warning about server-only code.

### 7.3 Claude CLI Server-Side Only

The `child_process` module is Node.js-only. `lib/claude.ts` uses `spawn` from `child_process`, which is unavailable in browser environments. This provides a hard technical boundary: the module cannot be accidentally included in client bundles.

Claude runs with no internet-exposed API key: the local `claude` binary uses credentials stored by the `claude login` command, scoped to the server's filesystem.

### 7.4 Input Validation in API Routes

Each API route performs explicit validation before calling library functions:

- `/api/execute` — validates `code` is a non-empty string, `language` is a string, `testCases` is an array, and each test case has `string` fields for `input` and `expected`. Returns `400` with a descriptive error for each failure.
- `/api/submissions` — checks that `problemId`, `code`, and `language` are all present.
- `/api/problems` — `page` and `limit` are clamped to safe ranges (min 1, max 100 for limit).
- `/api/problems/random` — validates difficulty value against a whitelist.
- `/api/ai/*` — each route validates its required fields (e.g., hintLevel range 1–3, stage against a valid list, explanation minimum length, targetDays range 1–365).

No user-supplied input is interpolated into database queries (Prisma uses parameterised queries by default). No user input is passed as shell arguments to the Claude CLI (the prompt is written to stdin, not passed as argv).

### 7.5 Shell Injection Prevention

`spawn` is called with `shell: false`. This means the first argument (`'claude'`) is executed directly without passing through a shell interpreter. The prompt is not an argument — it is written to `child.stdin`. These two choices together eliminate shell injection as an attack vector.

### 7.6 No Authentication in MVP

The MVP has no authentication. All activity is attributed to a single guest record. This is an explicitly accepted limitation. Planned mitigations for a future auth milestone:

- Implement NextAuth.js or Clerk for user sessions.
- Add `userId` extraction from session tokens in API routes.
- Add per-user rate limiting on AI endpoints to prevent abuse.
- Remove the guest upsert pattern from `/api/submissions`.

### 7.7 Code Execution Sandboxing

User code is executed in Judge0's sandbox environment, not on the application server. Judge0 CE provides OS-level isolation (cgroups, namespaces, seccomp filters). The application never `eval`s or `exec`s user-submitted code directly.

---

## 8. Testing Strategy

### 8.1 Overview

The project has three testing layers:

| Layer | Tool | Configuration | Purpose |
|---|---|---|---|
| Unit / Integration | Jest 30 + Testing Library | `jest.config.ts` | Test lib functions and components in isolation |
| E2E | Playwright | `playwright.config.ts` | Test critical user flows in a real browser |

### 8.2 Jest Configuration

```
jest.config.ts
├── testEnvironment: 'jsdom'         — simulates browser DOM
├── moduleNameMapper: @/ → <rootDir> — resolves path aliases
├── testPathIgnorePatterns: ['e2e/'] — exclude Playwright tests
└── collectCoverageFrom:
    ├── app/**/*.{ts,tsx}
    ├── components/**/*.{ts,tsx}
    └── lib/**/*.{ts,tsx}
    (excludes: *.d.ts, node_modules, app/generated)
```

Coverage provider is `v8` (native Node.js coverage, faster than Babel-based coverage).

### 8.3 Unit Tests: `lib/` Functions

| Module | What to Test |
|---|---|
| `lib/utils.ts` | `cn()` with various class combinations; conflicting Tailwind classes resolved correctly |
| `lib/judge0.ts` | `submitCode` with mocked `fetch`: successful response, 4xx/5xx errors, missing API key; `runTests` parallel execution, pass/fail logic, trimming |
| `lib/claude.ts` | `runClaude` / `streamClaude` with mocked `child_process.spawn`; all 6 exported functions with stubbed `runClaude`; JSON parsing fallback paths in `reviewCode`, `evaluateWhiteboardExplanation`, `generateStudyPlan` |
| `lib/db.ts` | Singleton pattern (globalThis reuse); PrismaClient constructor called with correct adapter |

### 8.4 Unit Tests: Components

| Component | What to Test |
|---|---|
| `CodeEditor` | Renders loading spinner before Monaco loads; renders editor with correct language prop |
| `LanguageSelector` | Renders all 5 languages; calls onChange with correct value |
| `TestCasePanel` | Shows test cases tab by default; shows spinner when isRunning; shows pass/fail in results tab |
| `ProblemRow` | Renders title link to correct slug; shows solved checkmark when solved=true |
| `DifficultyBadge` | Correct colour class for each difficulty |
| `StatsCard` | Renders value and title; applies correct colour class |
| `SubmissionHeatmap` | Renders correct number of cells; tooltip shows on hover |
| `CategoryProgress` | Renders correct bar widths; shows "no data" message when empty |
| `ChatMessage` | User message right-aligned; assistant message left-aligned; StreamingText used when isStreaming |
| `StreamingText` | Renders text; cursor blinks; cursor hidden when showCursor=false |

### 8.5 Integration Tests: API Routes

API routes should be tested with Prisma mocked via `jest.mock('@/lib/db')` to avoid requiring a real database. Judge0 and Claude CLI should be mocked at the `lib/judge0` and `lib/claude` import level.

| Route | Test Scenarios |
|---|---|
| `GET /api/problems` | Returns paginated list; filters by difficulty/category; search works; 500 on db error |
| `GET /api/problems/[slug]` | Returns problem; 404 when not found; 500 on db error |
| `GET /api/problems/random` | Returns random problem; excludes solved; 400 on invalid difficulty; 404 when none available |
| `POST /api/execute` | 400 on missing code; 400 on invalid test case shape; 200 with results; 502 on Judge0 failure |
| `POST /api/submissions` | Creates submission; creates guest user if needed; 400 on missing fields |
| `GET /api/submissions` | Returns filtered list; respects limit |
| `GET /api/stats` | Returns correct aggregated counts; streak calculation correct |
| `GET /api/stats/detailed` | Heatmap data correct; language stats ordered by count |
| `POST /api/ai/hint` | 400 on missing hintLevel; 400 on hintLevel outside 1-3; 200 with hint string |
| `POST /api/ai/review` | 400 on missing code; 200 with CodeReview object |
| `POST /api/ai/interview` | 400 on invalid stage; streaming response headers correct |
| `POST /api/ai/whiteboard` | 400 on short explanation; 200 with WhiteboardFeedback |
| `POST /api/ai/explain` | 400 on missing concept; 400 on invalid level; streaming response |
| `POST /api/ai/study-plan` | 400 on empty weakCategories; 400 on targetDays out of range; 200 with plan array |

### 8.6 E2E Tests: Playwright

Configuration: Chromium only, base URL `http://localhost:3000`, auto-starts dev server.

Test directory: `e2e/`

Critical flows to cover:

| Flow | Steps |
|---|---|
| Browse problems | Navigate to /problems → verify table loads → filter by difficulty → search by title → click problem title → verify problem page loads |
| Run code | Navigate to a problem → paste code → click Run → verify TestCasePanel shows results |
| Submit code | Run code → click Submit → verify submission appears in recent submissions on home page |
| Dashboard loads | Navigate to /dashboard → verify heatmap renders → verify tabs switch |
| AI hint | Navigate to problem → click Hint Level 1 → verify hint text appears |
| AI interview streaming | Navigate to /ai → select Interview tab → verify streamed text appears incrementally |
| Random problem | Click "Practice Random Easy" on home → verify redirect to a problem page |

### 8.7 Test Directory Structure

```
leetcode-mentor/
├── __tests__/                     ← Jest unit and integration tests
│   ├── lib/
│   │   ├── claude.test.ts
│   │   ├── judge0.test.ts
│   │   ├── db.test.ts
│   │   └── utils.test.ts
│   ├── components/
│   │   ├── editor/
│   │   │   ├── CodeEditor.test.tsx
│   │   │   ├── LanguageSelector.test.tsx
│   │   │   └── TestCasePanel.test.tsx
│   │   ├── problems/
│   │   │   └── ProblemRow.test.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsCard.test.tsx
│   │   │   ├── SubmissionHeatmap.test.tsx
│   │   │   └── CategoryProgress.test.tsx
│   │   └── ai/
│   │       ├── ChatMessage.test.tsx
│   │       └── StreamingText.test.tsx
│   └── api/
│       ├── problems.test.ts
│       ├── execute.test.ts
│       ├── submissions.test.ts
│       ├── stats.test.ts
│       └── ai/
│           ├── hint.test.ts
│           ├── review.test.ts
│           ├── interview.test.ts
│           ├── whiteboard.test.ts
│           ├── explain.test.ts
│           └── study-plan.test.ts
└── e2e/                           ← Playwright E2E tests
    ├── browse-problems.spec.ts
    ├── run-code.spec.ts
    ├── submit-code.spec.ts
    ├── dashboard.spec.ts
    ├── ai-hint.spec.ts
    ├── ai-interview.spec.ts
    └── random-problem.spec.ts
```

### 8.8 Test Commands

| Command | Description |
|---|---|
| `npm test` | Run all Jest tests once |
| `npm run test:watch` | Run Jest in watch mode |
| `npm run test:coverage` | Run Jest with V8 coverage report |
| `npm run test:e2e` | Run Playwright E2E tests (starts dev server automatically) |

---

## 9. Deployment

### 9.1 Required Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string, e.g. `postgresql://user:password@host:5432/leetcode_mentor` |
| `JUDGE0_API_KEY` | Yes | RapidAPI key for Judge0 CE access |

No `ANTHROPIC_API_KEY` is required. Claude authentication is handled by the `claude` CLI binary on the host machine (run `claude login` once).

### 9.2 Database Setup

```bash
# 1. Create the database (PostgreSQL must be running)
createdb leetcode_mentor

# 2. Run Prisma migrations to create the schema
npx prisma migrate deploy

# 3. Seed the database with initial problems
npm run db:seed
```

The seed script (`prisma/seed.ts`) populates the `Problem` table with curated LeetCode-style problems, complete with starter code for all 5 languages, hints, constraints, and reference solutions.

### 9.3 Claude CLI Setup

```bash
# Install Claude CLI (requires Node.js)
npm install -g @anthropic-ai/claude-cli

# Authenticate (interactive)
claude login

# Verify it works
claude -p "Hello" --output-format text
```

The `claude` binary must be on the `PATH` of the user running the Next.js server process. The application spawns it as `spawn('claude', ...)` without a full path.

### 9.4 Development

```bash
npm install          # Install dependencies
npm run dev          # Start Next.js dev server on http://localhost:3000
```

Next.js dev mode includes hot-module replacement. The Prisma singleton pattern (`globalForPrisma`) prevents connection pool exhaustion during HMR.

### 9.5 Production Build

```bash
npm run build        # Type-check and compile
npm start            # Start production server
```

### 9.6 Vercel Deployment Considerations

**Important limitation:** The Claude CLI subprocess approach is **incompatible with Vercel's default serverless runtime** as deployed on Vercel's infrastructure. The reasons are:

1. **Binary availability:** Vercel's serverless functions run in ephemeral containers where the `claude` binary is not installed and cannot be installed at request time.
2. **No persistent filesystem:** `claude login` credentials are stored on the filesystem; they cannot persist across function invocations in a stateless serverless environment.
3. **Process spawning:** While Node.js `child_process.spawn` technically works in some serverless contexts, there is no guarantee across all serverless providers.

**Options for cloud deployment:**

| Option | Trade-off |
|---|---|
| Self-hosted VPS (e.g., DigitalOcean Droplet, Hetzner) | Full control; install Claude CLI once; no cold-start limitation |
| Docker container with Claude CLI baked in | Portable; requires custom Docker image with `claude` binary and pre-authenticated credentials injected via environment |
| Replace Claude CLI with direct Anthropic SDK | Switch `lib/claude.ts` to use `@anthropic-ai/sdk` (already installed as a dependency); requires `ANTHROPIC_API_KEY` env var; fully compatible with Vercel |

The `@anthropic-ai/sdk` package is already listed as a dependency (`"@anthropic-ai/sdk": "^0.81.0"`) in `package.json`, indicating a migration path to direct API usage has been anticipated.

**Vercel is fully compatible** with the rest of the stack: Next.js API Routes, PostgreSQL (via a Vercel Postgres addon or external Neon/Supabase), and RapidAPI (Judge0) HTTP calls.

### 9.7 `prisma.config.ts`

A `prisma.config.ts` file exists at the project root. This is a Prisma v7 feature for configuring the Prisma CLI. In conjunction with the `output` directive in `schema.prisma` pointing to `../app/generated/prisma`, it ensures the generated client is placed outside `node_modules` and tracked appropriately.

---

*End of Software Design Document*
