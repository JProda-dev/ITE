const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DB_PATH = path.join(ROOT, "database.json");

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}
function writeDB(data) {
  const tmp = DB_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, DB_PATH);
}
function send(res, status, body, type="application/json; charset=utf-8") {
  res.writeHead(status, {"Content-Type": type, "Cache-Control": "no-store"});
  res.end(type.includes("json") ? JSON.stringify(body) : body);
}
function bodyJSON(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", c => {
      data += c;
      if (data.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch(e) { reject(e); }
    });
  });
}
function safeText(v, max=60) {
  return String(v ?? "").trim().slice(0, max);
}
const mime = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml"};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname === "/api/db" && req.method === "GET") return send(res, 200, readDB());

    if (url.pathname === "/api/players" && req.method === "POST") {
      const input = await bodyJSON(req);
      const name = safeText(input.name, 32);
      if (!name) return send(res, 400, {error:"El nombre es obligatorio"});
      const db = readDB();
      if (db.players.some(p => p.name.toLowerCase() === name.toLowerCase())) return send(res, 409, {error:"Ese jugador ya existe"});
      const player = {id: crypto.randomUUID(), name, avatar: name.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase(), createdAt:new Date().toISOString()};
      db.players.push(player); writeDB(db); return send(res, 201, player);
    }

    if (url.pathname === "/api/results" && req.method === "POST") {
      const input = await bodyJSON(req);
      const db = readDB();
      const allowed = ["classic","silhouette","zoom","description"];
      const date = /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? input.date : "";
      const playerId = safeText(input.playerId, 64);
      const category = safeText(input.category, 20);
      const attempts = Number(input.attempts);
      const generation = Number(input.generation);
      const solved = Boolean(input.solved);
      if (!date || !db.players.some(p=>p.id===playerId) || !allowed.includes(category) || !Number.isInteger(attempts) || attempts < 1 || attempts > 99 || !Number.isInteger(generation) || generation < 1 || generation > 9) {
        return send(res, 400, {error:"Datos no válidos"});
      }
      const existing = db.results.find(r => r.date===date && r.playerId===playerId && r.category===category);
      if (existing) Object.assign(existing, {attempts,generation,solved});
      else db.results.push({id:crypto.randomUUID(),date,playerId,category,attempts,generation,solved});
      writeDB(db); return send(res, 201, {ok:true});
    }

    if (url.pathname.startsWith("/api/results/") && req.method === "DELETE") {
      const id = decodeURIComponent(url.pathname.split("/").pop());
      const db = readDB(); const before = db.results.length;
      db.results = db.results.filter(r=>r.id!==id);
      if (before === db.results.length) return send(res,404,{error:"Resultado no encontrado"});
      writeDB(db); return send(res,200,{ok:true});
    }

    let filePath = url.pathname === "/" ? path.join(ROOT,"index.html") : path.join(ROOT, url.pathname);
    if (!filePath.startsWith(ROOT)) return send(res,403,"Forbidden","text/plain");
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return send(res,404,"Not found","text/plain");
    return send(res,200,fs.readFileSync(filePath),mime[path.extname(filePath)] || "application/octet-stream");
  } catch (e) {
    console.error(e);
    return send(res,500,{error:"Error interno"});
  }
});
server.listen(PORT, () => console.log(`Pokédle League disponible en http://localhost:${PORT}`));
