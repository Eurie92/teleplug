# ⚡ TelePlug: 24/7 Telegram Auto-Plugger & Message Forwarder

A production-ready, fullstack 24/7 automation suite for Telegram marketing, auto-broadcasting, and real-time message forwarding with an integrated **React 19 + Vite** dashboard.

Powered natively by **TypeScript** and **`@mtcute` MTProto**.

---

## ✨ Features

- **24/7 Auto-Plugger Broadcaster:**
  - Automatically scans and indexes all groups/channels joined by your Telegram account.
  - Granular interval scheduling: Every 1 hr, 2 hrs, 3 hrs, or custom minutes.
  - **Spintax Variation Engine:** Supports nested `{Hey|Hello|Hi}` patterns and dynamic tags (`{group_name}`, `{time}`, `{random_num}`) to defeat Telegram hash-based duplicate spam filters.
  - **Anti-Ban Jitter:** Configurable delays (default 15–45s) between group messages to emulate human posting behavior.
  - **Automatic Flood-Wait Armor:** Catches Telegram `FLOOD_WAIT_X` limits, backs off gracefully, and alerts the UI without crashing.
  - Group Selector with search, writable vs read-only status badges, and batch selection.

- **Real-Time Message Forwarder (Chat Mirroring & Signals):**
  - Listens to incoming messages in real-time using `@mtcute/dispatcher`.
  - Configurable routing matrix (`Source Chat ID` ➔ `Target Chat ID`).
  - Keyword Whitelist & Blacklist filtering (e.g. forward only messages containing `SOL`, `BUY`, etc.).
  - **Clean Repost Option:** Reposts as a fresh new message without the "Forwarded from" header.
  - Optional promotional footer or marketing plug appended to forwarded posts.

- **Integrated Fullstack Dashboard:**
  - Modern Telegram-dark themed React 19 + Tailwind CSS interface.
  - Real-time **WebSocket Console** streaming execution logs and event statuses.
  - Account manager with phone OTP login and 2FA password support.
  - Single-port architecture: Express backend serves both the API and the React frontend on `PORT 3000`.

---

## 🚀 Quick Start (Local)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your credentials from [my.telegram.org](https://my.telegram.org):
```env
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
PORT=3000
```
*(You can also enter your API ID and Hash directly via the web dashboard).*

### 3. Build & Run
```bash
# Build both frontend and backend
npm run build

# Start the unified server
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deploying 24/7 to BotKeep Cloud

[BotKeep Cloud](https://botkeep.cloud) provides a persistent 24/7 Node.js container with 2GB RAM and 2GB disk storage—ideal for running Telegram MTProto userbots without serverless timeouts.

### Step 1: Push your code to GitHub
```bash
# If you haven't set up your remote repository yet:
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git branch -M main
git push -u origin main
```

### Step 2: Create a Server on BotKeep Cloud
1. Go to your [BotKeep Cloud Dashboard](https://botkeep.cloud/app).
2. Click **Create Server** and choose the **Node.js** environment.
3. Allocate your resources (e.g. 1024–2048 MB RAM, 100–150% CPU).
4. Link your GitHub repository or upload the project files.

### Step 3: Configure Environment Variables
In the BotKeep Panel ➔ **Startup / Environment Variables**, set:
- `TELEGRAM_API_ID`: Your API ID from my.telegram.org
- `TELEGRAM_API_HASH`: Your API Hash from my.telegram.org
- `PORT`: `3000` (or assign the port given by BotKeep)

### Step 4: Startup Command
Set the startup command in BotKeep:
```bash
npm run build && npm start
```
*(Or if you build locally before pushing, simply `npm start`).*

Your server will now run 24/7 in the background with persistent session storage in `data/`.

---

## 🧪 Testing

Run Vitest unit tests for Spintax and Jitter engines:
```bash
npm test
```

---

## 🛡️ Anti-Ban Best Practices

1. **Avoid Rapid Blasts:** Always keep the delay between groups at 20 seconds or higher.
2. **Use Spintax:** Never send the exact same text to 20+ groups repeatedly; always wrap phrases in `{...|...}`.
3. **Respect Group Rules:** Deselect groups with strict anti-bot policies or captchas to avoid being banned by group admins.
