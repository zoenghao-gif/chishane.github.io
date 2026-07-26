import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createReadStream, existsSync, mkdirSync } from "node:fs";
import { join, extname, resolve } from "node:path";
import { randomInt, randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const ROOT = resolve(process.cwd());
const DATA_DIR = join(ROOT, "data");
const DB_PATH = join(DATA_DIR, "what-to-eat.sqlite");
const DIST_DIR = join(ROOT, "dist");
const PORT = Number(process.env.PORT || 8787);
const COOKIE_NAME = "what_to_eat_device";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    required_gap_meals INTEGER NOT NULL DEFAULT 5 CHECK (required_gap_meals BETWEEN 0 AND 99),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS meal_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shop_name TEXT NOT NULL CHECK (length(trim(shop_name)) > 0),
    food_name TEXT,
    eat_date TEXT NOT NULL,
    eat_time TEXT NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('main_meal', 'late_night')),
    meal_period TEXT NOT NULL DEFAULT 'noon' CHECK (meal_period IN ('noon', 'evening', 'late_night')),
    client_action_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, client_action_id)
  );

  CREATE INDEX IF NOT EXISTS meal_records_user_order_idx
    ON meal_records (user_id, meal_type, eat_date DESC, eat_time DESC, created_at DESC, id DESC);
`);

const mealColumns = db.prepare("PRAGMA table_info(meal_records)").all().map((column) => column.name);
if (!mealColumns.includes("meal_period")) {
  db.exec("ALTER TABLE meal_records ADD COLUMN meal_period TEXT NOT NULL DEFAULT 'noon'");
  db.exec("UPDATE meal_records SET meal_period = CASE WHEN meal_type = 'late_night' THEN 'late_night' WHEN CAST(substr(eat_time, 1, 2) AS INTEGER) < 16 THEN 'noon' ELSE 'evening' END");
}

const jsonHeaders = { "Content-Type": "application/json; charset=utf-8" };
const allowedMealTypes = new Set(["main_meal", "late_night"]);
const allowedMealPeriods = new Set(["noon", "evening", "late_night"]);
const mealPeriodMeta = {
  noon: { mealType: "main_meal", eatTime: "12:00" },
  evening: { mealType: "main_meal", eatTime: "18:00" },
  late_night: { mealType: "late_night", eatTime: "23:00" },
};

function sendJson(res, status, body, extraHeaders = {}) {
  res.writeHead(status, { ...jsonHeaders, ...extraHeaders });
  res.end(JSON.stringify(body));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key, value]) => key && value)
      .map(([key, ...value]) => [key, decodeURIComponent(value.join("="))]),
  );
}

function validDeviceId(value) {
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);
}

function getOrCreateUser(req, res, { create = true } = {}) {
  const cookies = parseCookies(req);
  if (!validDeviceId(cookies[COOKIE_NAME]) && !create) return null;
  const deviceId = validDeviceId(cookies[COOKIE_NAME]) ? cookies[COOKIE_NAME] : randomUUID();
  let user = db.prepare("SELECT id, device_id FROM users WHERE device_id = ?").get(deviceId);

  if (!user) {
    db.prepare("INSERT INTO users (id, device_id) VALUES (?, ?)").run(deviceId, deviceId);
    db.prepare("INSERT INTO user_settings (user_id) VALUES (?)").run(deviceId);
    user = { id: deviceId, device_id: deviceId };
  }

  if (cookies[COOKIE_NAME] !== deviceId) {
    res.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=${encodeURIComponent(deviceId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
    );
  }
  return user;
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error("请求内容过大");
  }
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("请求格式不正确");
  }
}

function isMealType(value) {
  return typeof value === "string" && allowedMealTypes.has(value);
}

function isMealPeriod(value) {
  return typeof value === "string" && allowedMealPeriods.has(value);
}

function cleanText(value, maxLength = 100) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text.slice(0, maxLength) : null;
}

function validateMealInput(body) {
  const shopName = cleanText(body.shop_name);
  const foodName = cleanText(body.food_name);
  const eatDate = typeof body.eat_date === "string" ? body.eat_date : "";
  const mealPeriod = body.meal_period;
  const eatTime = mealPeriodMeta[mealPeriod]?.eatTime ?? "";
  const mealType = mealPeriodMeta[mealPeriod]?.mealType ?? "";
  if (!shopName) throw new Error("请填写店名");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eatDate)) throw new Error("吃饭日期格式不正确");
  if (!/^\d{2}:\d{2}/.test(eatTime)) throw new Error("用餐时间格式不正确");
  if (!isMealType(mealType)) throw new Error("用餐类型不正确");
  if (!isMealPeriod(mealPeriod)) throw new Error("用餐时间不正确");
  const meta = mealPeriodMeta[mealPeriod];
  return { shopName, foodName, eatDate, eatTime: meta.eatTime, mealType: meta.mealType, mealPeriod };
}

function recordPayload(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    shop_name: row.shop_name,
    food_name: row.food_name,
    eat_date: row.eat_date,
    eat_time: row.eat_time,
    meal_type: row.meal_type,
    meal_period: row.meal_period,
    client_action_id: row.client_action_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function compareRecords(a, b) {
  return (
    a.eat_date.localeCompare(b.eat_date) ||
    a.eat_time.localeCompare(b.eat_time) ||
    a.created_at.localeCompare(b.created_at) ||
    a.id.localeCompare(b.id)
  );
}

function getCandidate(userId, mealType, excludedNames) {
  const setting = db.prepare("SELECT required_gap_meals FROM user_settings WHERE user_id = ?").get(userId);
  const requiredGap = setting?.required_gap_meals ?? 5;
  const records = db
    .prepare("SELECT * FROM meal_records WHERE user_id = ? AND meal_type = ? ORDER BY eat_date, eat_time, created_at, id")
    .all(userId, mealType);
  const excluded = new Set(excludedNames.map((name) => String(name).trim()));
  const shops = new Map();

  for (const record of records) {
    const normalized = record.shop_name.trim();
    const current = shops.get(normalized) || { latest: record, latestFood: null };
    if (compareRecords(current.latest, record) < 0) current.latest = record;
    if (record.food_name?.trim()) {
      if (!current.latestFood || compareRecords(current.latestFood, record) < 0) current.latestFood = record;
    }
    shops.set(normalized, current);
  }

  const candidates = [...shops.entries()]
    .map(([normalized, shop]) => {
      const gap = records.filter((record) => compareRecords(record, shop.latest) > 0).length;
      return {
        normalized,
        shop_name: shop.latest.shop_name.trim(),
        food_name: shop.latestFood?.food_name ?? null,
        gap_meals: gap,
      };
    })
    .filter((candidate) => candidate.gap_meals >= requiredGap && !excluded.has(candidate.normalized));

  if (!candidates.length) return null;
  return candidates[randomInt(candidates.length)];
}

async function serveStatic(req, res) {
  if (!existsSync(DIST_DIR)) {
    sendError(res, 404, "前端尚未构建，请先运行 pnpm build");
    return;
  }
  const requested = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const relative = requested === "/" ? "index.html" : requested.replace(/^\//, "");
  const filePath = resolve(DIST_DIR, relative);
  if (!filePath.startsWith(DIST_DIR) || !(await stat(filePath).catch(() => null))) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    createReadStream(join(DIST_DIR, "index.html")).pipe(res);
    return;
  }
  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".json": "application/json; charset=utf-8",
  };
  res.writeHead(200, { "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream" });
  createReadStream(filePath).pipe(res);
}

async function handleApi(req, res, url) {
  const path = url.pathname;

  if (req.method === "GET" && path === "/api/session") {
    const user = getOrCreateUser(req, res, { create: url.searchParams.get("create") === "1" });
    if (!user) {
      sendJson(res, 200, { userId: null });
      return;
    }
    sendJson(res, 200, { userId: user.id });
    return;
  }

  const user = getOrCreateUser(req, res);

  if (req.method === "GET" && path === "/api/meals") {
    const page = Math.max(0, Number(url.searchParams.get("page") || 0));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 20)));
    const rows = db.prepare(`
      SELECT * FROM meal_records
      WHERE user_id = ?
      ORDER BY eat_date DESC, eat_time DESC, created_at DESC, id DESC
      LIMIT ? OFFSET ?
    `).all(user.id, limit, page * limit);
    sendJson(res, 200, rows.map(recordPayload));
    return;
  }

  const mealMatch = path.match(/^\/api\/meals\/([^/]+)$/);
  if (req.method === "GET" && mealMatch) {
    const row = db.prepare("SELECT * FROM meal_records WHERE id = ? AND user_id = ?").get(mealMatch[1], user.id);
    if (!row) return sendError(res, 404, "记录不存在");
    sendJson(res, 200, recordPayload(row));
    return;
  }

  if (req.method === "GET" && path === "/api/count") {
    const mealType = url.searchParams.get("meal_type");
    if (!isMealType(mealType)) return sendError(res, 400, "用餐类型不正确");
    const row = db.prepare("SELECT COUNT(*) AS count FROM meal_records WHERE user_id = ? AND meal_type = ?").get(user.id, mealType);
    sendJson(res, 200, { count: Number(row.count) });
    return;
  }

  if (req.method === "GET" && path === "/api/settings") {
    const row = db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(user.id);
    sendJson(res, 200, row);
    return;
  }

  if (req.method === "PUT" && path === "/api/settings") {
    const body = await readJson(req);
    const value = Number(body.required_gap_meals);
    if (!Number.isInteger(value) || value < 0 || value > 99) return sendError(res, 400, "请输入 0–99 之间的整数");
    db.prepare("UPDATE user_settings SET required_gap_meals = ?, updated_at = datetime('now') WHERE user_id = ?").run(value, user.id);
    sendJson(res, 200, db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(user.id));
    return;
  }

  if (req.method === "POST" && path === "/api/draw") {
    const body = await readJson(req);
    if (!isMealType(body.mealType)) return sendError(res, 400, "用餐类型不正确");
    const excluded = Array.isArray(body.excludedShopNames) ? body.excludedShopNames : [];
    sendJson(res, 200, { candidate: getCandidate(user.id, body.mealType, excluded) });
    return;
  }

  if (req.method === "POST" && path === "/api/meals") {
    const body = await readJson(req);
    const input = validateMealInput(body);
    const actionId = validDeviceId(body.client_action_id) ? body.client_action_id : randomUUID();
    const id = randomUUID();
    db.prepare(`
      INSERT OR IGNORE INTO meal_records (id, user_id, shop_name, food_name, eat_date, eat_time, meal_type, meal_period, client_action_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, user.id, input.shopName, input.foodName, input.eatDate, input.eatTime, input.mealType, input.mealPeriod, actionId);
    const row = db.prepare("SELECT * FROM meal_records WHERE user_id = ? AND client_action_id = ?").get(user.id, actionId);
    sendJson(res, 200, recordPayload(row));
    return;
  }

  if ((req.method === "PATCH" || req.method === "DELETE") && mealMatch) {
    const recordId = mealMatch[1];
    const existing = db.prepare("SELECT * FROM meal_records WHERE id = ? AND user_id = ?").get(recordId, user.id);
    if (!existing) return sendError(res, 404, "记录不存在");
    if (req.method === "DELETE") {
      db.prepare("DELETE FROM meal_records WHERE id = ? AND user_id = ?").run(recordId, user.id);
      sendJson(res, 200, { deleted: true });
      return;
    }
    const input = validateMealInput(await readJson(req));
    db.prepare(`
      UPDATE meal_records
      SET shop_name = ?, food_name = ?, eat_date = ?, eat_time = ?, meal_type = ?, meal_period = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(input.shopName, input.foodName, input.eatDate, input.eatTime, input.mealType, input.mealPeriod, recordId, user.id);
    sendJson(res, 200, recordPayload(db.prepare("SELECT * FROM meal_records WHERE id = ? AND user_id = ?").get(recordId, user.id)));
    return;
  }

  if (req.method === "DELETE" && path === "/api/account") {
    db.exec("BEGIN");
    try {
      db.prepare("DELETE FROM users WHERE id = ?").run(user.id);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    sendJson(res, 200, { deleted: true }, { "Set-Cookie": `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` });
    return;
  }

  sendError(res, 404, "接口不存在");
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      sendError(res, 405, "Method not allowed");
      return;
    }
    await serveStatic(req, res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) sendError(res, 400, error instanceof Error ? error.message : "请求失败");
    else res.end();
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Local site server listening at http://127.0.0.1:${PORT}`);
  console.log(`SQLite database: ${DB_PATH}`);
});

function close() {
  db.close();
  server.close(() => process.exit(0));
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
