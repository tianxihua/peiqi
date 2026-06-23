# 傻蛋佩奇 Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure local browser chat page named “傻蛋佩奇” whose bot replies always start with `~哼哼~`.

**Architecture:** Create one self-contained HTML file for the app and one Node-based static verification script. The app keeps all UI, styling, and local reply rules in `傻蛋佩奇/index.html`; the test script checks the contract without needing a dev server.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node.js built-in `fs` and `assert`.

---

### Task 1: Static Contract Test

**Files:**
- Create: `tests/check-shadan-peiqi.js`
- Create: `傻蛋佩奇/index.html`

- [ ] **Step 1: Write the failing test**

Create `tests/check-shadan-peiqi.js` with assertions that require the chat page to exist, define `withCatchphrase()`, contain the fixed `~哼哼~` phrase, define keyword-based replies, support Enter-to-send, and include a clear chat action.

- [ ] **Step 2: Run the test to verify it fails**

Run: `node tests/check-shadan-peiqi.js`

Expected: FAIL because `傻蛋佩奇/index.html` does not exist yet.

- [ ] **Step 3: Write the app**

Create `傻蛋佩奇/index.html` as a self-contained static app with:

- Responsive chat layout.
- Header avatar, name, and status.
- Chat transcript area.
- Input, send button, and clear button.
- JavaScript reply rules.
- A `withCatchphrase(reply)` function used by every bot message path.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node tests/check-shadan-peiqi.js`

Expected: PASS with all static contract checks passing.

- [ ] **Step 5: Browser smoke check**

Open `傻蛋佩奇/index.html` in a browser and send at least one message. Verify the bot reply starts with `~哼哼~` and the page layout is usable on desktop-sized viewport.

