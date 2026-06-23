const assert = require("assert");
const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "..", "我的世界.html");
assert.ok(fs.existsSync(htmlPath), "我的世界.html should exist");

const html = fs.readFileSync(htmlPath, "utf8");

const requiredSnippets = [
  ["camp helper", "function isCampArea(area)"],
  ["player in monster area helper", "function isPlayerInsideMonsterArea(area)"],
  ["monster camp activity helper", "function isMonsterCampActive(monster)"],
  ["camp spawn cap helper", "function getAreaMaxActive(area)"],
  ["camp spawn activation uses area radius", "if (isCampArea(area)) return isPlayerInsideMonsterArea(area);"],
  ["camp movement guard", "if (!isMonsterCampActive(m))"],
  ["recursive monster melee raycast", "raycaster.intersectObjects(monsterMeshes, true)"],
  ["recursive monster resolution", "function resolveMonsterFromHitObject(object)"],
];

for (const [label, snippet] of requiredSnippets) {
  assert.ok(html.includes(snippet), `Missing ${label}: ${snippet}`);
}

const campAreaMatches = html.match(/kind: '据点营地'[\s\S]*?maxActive: 3/g) || [];
assert.ok(campAreaMatches.length >= 4, "Each camp should cap active monsters at 3");

assert.ok(!html.includes("activationRadius: 760"), "Global activation radius should not wake every camp from far away");
assert.ok(!html.includes("maxActive: 24"), "Camp maxActive should not remain dense at 24");

console.log("monster camp checks passed.");
