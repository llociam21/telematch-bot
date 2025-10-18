// scores.js (CommonJS)
// Mini-módulo de puntuaciones con persistencia simple en archivo JSON.
// Nota: en Render Free el disco es efímero y se pierde en cada redeploy.
// Entre reinicios sin redeploy, los datos sí se conservan.

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "scores.json");
let scores = {};

// --- carga/guardado ---
function load() {
  try {
    scores = JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    scores = {};
  }
}
function save() {
  try {
    fs.writeFileSync(FILE, JSON.stringify(scores, null, 2), "utf8");
  } catch {}
}
load();

// --- API pública ---
function addWin(userId, name) {
  const id = String(userId);
  const entry = scores[id] || { name, points: 0, wins: 0, played: 0 };
  entry.wins += 1;
  entry.points += 10; // +10 por acierto
  entry.played += 1;
  entry.name = name;
  scores[id] = entry;
  save();
  return entry;
}

function addLoss(userId, name) {
  const id = String(userId);
  const entry = scores[id] || { name, points: 0, wins: 0, played: 0 };
  entry.played += 1;
  entry.name = name;
  scores[id] = entry;
  save();
  return entry;
}

function getStats(userId) {
  return scores[String(userId)] || { name: "", points: 0, wins: 0, played: 0 };
}

function getTop(n = 5) {
  return Object.entries(scores)
    .map(([id, e]) => ({ id, ...e }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins)
    .slice(0, n);
}

module.exports = { addWin, addLoss, getStats, getTop };