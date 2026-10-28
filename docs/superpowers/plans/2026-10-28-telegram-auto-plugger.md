# Telegram Auto-Plugger & Message Forwarder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, production-ready Telegram Auto-Plugger and Message Forwarder running 24/7 on BotKeep Cloud with an integrated React + Vite web dashboard and TypeScript `@mtcute` MTProto engine.

**Architecture:** Monorepo/unified Node.js service where Express/Fastify runs an MTProto userbot engine in the background and serves a pre-compiled React + Vite control panel on the same port. Persistent configuration and session data are stored in local SQLite / JSON storage on BotKeep's persistent 2GB disk.

**Tech Stack:**
- **Backend / Engine:** Node.js (v24), TypeScript, `@mtcute/node`, `@mtcute/dispatcher`, Express, WebSockets (`ws`)
- **Frontend Dashboard:** React 19, Vite, Tailwind CSS, Lucide React
- **Storage:** Local persistent JSON/SQLite store
- **Deployment:** BotKeep Cloud (Pterodactyl Node.js environment) / Git repository

**Spec:** `C:\Users\EURIE\.gemini\antigravity-cli\brain\1158a337-3b84-4b71-8696-7978bf73c75e\research-and-architecture-plan.md`

## Global Constraints
- Unified single-port deployment: backend serves the built React frontend from `/dist/public`.
- Zero crash on Telegram `FLOOD_WAIT`: bot must intercept rate limits and sleep without restarting.
- Spintax variation must execute on every broadcast to prevent Telegram hash-based spam bans.
- Human jitter: configurable inter-group delays (default 15–40s) and cycle variance (±5–10m).
- All code in TypeScript with strict typing.

## Review Focus
1. **Telegram Rate Limits & Flood Waits:** Bot gracefully pauses during `FLOOD_WAIT_X` and alerts the UI without disconnecting or crashing.
2. **Session Persistence:** When BotKeep restarts the container, the authenticated Telegram session automatically restores without re-entering OTP.
3. **Restricted Groups:** Bot identifies groups where the user lacks `canSendMessages` permissions and skips them cleanly.
4. **Spintax Edge Cases:** Nested `{a|{b|c}}` and unbalanced braces are safely normalized without throwing runtime exceptions.
5. **Real-time UI Sync:** WebSocket pushes live broadcast progress and error logs directly to the browser dashboard.

---

### Task 1: Project Scaffolding & Git Init

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.server.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `README.md`

**Interfaces:**
- Produces: Project root configuration, scripts (`npm run build`, `npm run dev`, `npm start`), Git repo initialized.

- [ ] **Step 1: Initialize Git repository**
  Run `git init` and configure initial `.gitignore` (ignoring `node_modules`, `dist`, `data/*.session`, `.env`).
- [ ] **Step 2: Create `package.json` with dependencies**
  Install `@mtcute/node`, `@mtcute/dispatcher`, `express`, `ws`, `dotenv`, `cors`, and dev dependencies (`typescript`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `tsx`, `vitest`).
- [ ] **Step 3: Setup TypeScript configurations**
  Configure root `tsconfig.json` for frontend and `tsconfig.server.json` for Node.js backend.
- [ ] **Step 4: Commit setup**
  Commit the baseline scaffolding to git.

---

### Task 2: Core Utilities: Spintax & Jitter Engine

**Files:**
- Create: `src/server/utils/spintax.ts`
- Create: `src/server/utils/jitter.ts`
- Test: `tests/spintax.test.ts`
- Test: `tests/jitter.test.ts`

**Interfaces:**
- Produces: `parseSpintax(template: string): string`
- Produces: `getRandomDelay(minMs: number, maxMs: number): number`
- Produces: `sleep(ms: number): Promise<void>`

- [ ] **Step 1: Write tests for Spintax & Jitter**
  Create Vitest unit tests verifying `{A|B|C}` randomization, nested spintax, plain strings, and jitter boundaries.
- [ ] **Step 2: Implement `src/server/utils/spintax.ts`**
  Implement recursive regex-based Spintax processor.
- [ ] **Step 3: Implement `src/server/utils/jitter.ts`**
  Implement random delay helpers and async sleep functions.
- [ ] **Step 4: Run tests**
  Verify all tests pass (`npx vitest run`).
- [ ] **Step 5: Commit changes**
  Commit utilities and unit tests.

---

### Task 3: Configuration & State Store

**Files:**
- Create: `src/server/store/configStore.ts`
- Create: `src/server/types/index.ts`
- Test: `tests/configStore.test.ts`

**Interfaces:**
- Produces: `ConfigStore` class with `loadConfig()`, `saveConfig()`, `getSettings()`, `updatePlugSettings()`, `updateForwardRoutes()`.
- Data model:
  - `plugger`: `{ enabled: boolean, intervalMinutes: number, messageTemplate: string, minDelaySec: number, maxDelaySec: number, targetGroupIds: string[] }`
  - `forwarder`: `{ enabled: boolean, routes: Array<{ id: string, sourceChatId: string, targetChatId: string, keywords: string[], excludeKeywords: string[], cleanCopy: boolean, footerPlug?: string }> }`

- [ ] **Step 1: Define TypeScript interfaces in `src/server/types/index.ts`**
- [ ] **Step 2: Implement persistent `ConfigStore` in `src/server/store/configStore.ts`**
  Reads/writes to `data/config.json` with fallback defaults.
- [ ] **Step 3: Test `ConfigStore`**
  Write and run Vitest test for save/load operations.
- [ ] **Step 4: Commit changes**

---

### Task 4: Telegram MTProto Client Engine (`@mtcute`)

**Files:**
- Create: `src/server/telegram/client.ts`
- Create: `src/server/telegram/auth.ts`
- Create: `src/server/telegram/dialogs.ts`
- Create: `src/server/telegram/plugger.ts`
- Create: `src/server/telegram/forwarder.ts`

**Interfaces:**
- Produces: `TelegramManager` singleton coordinating login, dialog synchronization, auto-plug scheduled broadcaster, and live message forwarder dispatcher.
- WebSocket logger callback hooks for pushing events to the UI.

- [ ] **Step 1: Implement `client.ts`**
  Initialize `@mtcute/node` `TelegramClient` pointing session storage to `data/tg-session`.
- [ ] **Step 2: Implement `auth.ts`**
  Support phone login + OTP code verification, password 2FA, and session status check.
- [ ] **Step 3: Implement `dialogs.ts`**
  Fetch all dialogs, filter out direct user PMs, identify groups/supergroups, and check `canSendMessages` permissions.
- [ ] **Step 4: Implement `plugger.ts` (Auto-Plugger Broadcaster)**
  Background loop:
  - Runs on configured interval (e.g. 60m, 120m, 180m).
  - Iterates over active target groups.
  - Generates Spintax message.
  - Sends message with randomized delay between groups.
  - Catches `FLOOD_WAIT` and sleeps without dying.
  - Emits real-time progress events to WebSocket logger.
- [ ] **Step 5: Implement `forwarder.ts` (Auto-Forwarder Listener)**
  Uses `@mtcute/dispatcher` `dp.onNewMessage` to listen to source chats, matches filter criteria, and forwards/reposts to destination targets.
- [ ] **Step 6: Commit changes**

---

### Task 5: Backend Express & WebSocket API Server

**Files:**
- Create: `src/server/server.ts`
- Create: `src/server/api/routes.ts`
- Create: `src/server/websocket/hub.ts`

**Interfaces:**
- Produces: Express HTTP server handling `/api/status`, `/api/auth/*`, `/api/config`, `/api/dialogs`, `/api/plugger/toggle`, and WS connection at `/ws`.

- [ ] **Step 1: Implement WebSocket log hub (`hub.ts`)**
  Allows broadcasting log messages and status updates to all connected browser tabs.
- [ ] **Step 2: Implement REST routes (`routes.ts`)**
  Wire all client controls and config updates.
- [ ] **Step 3: Implement `server.ts`**
  Start Express, mount static build folder for React frontend, and bind WebSocket server on port `PORT || 3000`.
- [ ] **Step 4: Commit changes**

---

### Task 6: React + Vite Control Panel Dashboard

**Files:**
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `src/client/main.tsx`
- Create: `src/client/App.tsx`
- Create: `src/client/components/AuthCard.tsx`
- Create: `src/client/components/PluggerTab.tsx`
- Create: `src/client/components/ForwarderTab.tsx`
- Create: `src/client/components/LiveConsole.tsx`
- Create: `src/client/components/GroupSelector.tsx`

**Interfaces:**
- Produces: Modern responsive dark-mode dashboard with:
  - Account status & OTP Login modal
  - Auto-Plugger config (Timer interval buttons 1h/2h/3h/custom, Spintax editor with live preview, Group checklist)
  - Auto-Forwarder rule manager (Source -> Target mapping with keyword filters)
  - Live activity log console connected via WebSocket

- [ ] **Step 1: Set up Vite & Tailwind CSS in `src/client`**
- [ ] **Step 2: Build `AuthCard` and connection status badge**
- [ ] **Step 3: Build `PluggerTab` with Spintax test box and interval settings**
- [ ] **Step 4: Build `ForwarderTab` with route creator modal**
- [ ] **Step 5: Build `LiveConsole` with auto-scroll and color-coded status badges**
- [ ] **Step 6: Test frontend build with `npm run build`**
- [ ] **Step 7: Commit changes**

---

### Task 7: BotKeep Deployment Ready & Git Push Preparation

**Files:**
- Create: `botkeep.json` / startup config
- Create: `Dockerfile` (optional for Docker hosts)
- Update: `README.md` with step-by-step BotKeep deployment guide

- [ ] **Step 1: Add BotKeep / Pterodactyl startup instructions to `README.md`**
- [ ] **Step 2: Test full build (`npm run build`) and start script (`npm start`)**
- [ ] **Step 3: Prepare final git commit so user can run `git remote add origin ...` and `git push`**
