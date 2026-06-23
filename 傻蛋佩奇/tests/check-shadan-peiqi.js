const assert = require("assert");
const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "..", "index.html");

assert.ok(fs.existsSync(htmlPath), "傻蛋佩奇/index.html should exist");

const html = fs.readFileSync(htmlPath, "utf8");

const requiredSnippets = [
  ["page title", "<title>傻蛋佩奇"],
  ["catchphrase text", "~哼哼~"],
  ["catchphrase wrapper", "function withCatchphrase(reply)"],
  ["bot message wrapper call", "addBotMessage(withCatchphrase"],
  ["reply generator", "function createReply(message)"],
  ["send handler", "function sendMessage()"],
  ["multiline textarea", "<textarea"],
  ["clear chat action", "function resetChat()"],
  ["empty message guard", "messageInput.classList.add(\"shake\")"],
  ["thinking indicator", "傻蛋佩奇正在想"],
  ["two-panel shell", "class=\"workspace\""],
  ["history panel", "class=\"history-panel\""],
  ["history title", "历史对话"],
  ["new chat button", "新建聊天"],
  ["rename chat button", "重命名聊天"],
  ["collapse button", "收起"],
  ["round send button", "aria-label=\"发送消息\""],
  ["voice button", "aria-label=\"语音输入\""],
  ["microphone icon", "class=\"mic-icon\""],
  ["voice button element", "const voiceButton = document.getElementById(\"voiceButton\")"],
  ["speech recognition support", "window.SpeechRecognition || window.webkitSpeechRecognition"],
  ["voice click handler", "voiceButton.addEventListener(\"click\""],
  ["speech result fills input", "messageInput.value = transcript"],
  ["command enter shortcut", "event.metaKey && event.key === \"Enter\""],
];

for (const [label, snippet] of requiredSnippets) {
  assert.ok(html.includes(snippet), `Missing ${label}: ${snippet}`);
}

const botWrapperCalls = html.match(/addBotMessage\(withCatchphrase/g) || [];
assert.ok(
  botWrapperCalls.length >= 2,
  "Bot messages should be routed through withCatchphrase in initial and generated replies"
);

assert.ok(!html.includes(">♩</button>"), "Voice button should not use a music-note glyph");
assert.ok(
  !html.includes("if (event.key === \"Enter\")"),
  "Plain Enter should insert a newline instead of sending"
);

console.log("傻蛋佩奇 static checks passed.");
