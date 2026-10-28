import { validate } from "./questions.js";
import { formPage, resultsPage, resultsCsv } from "./pages.js";
import { handbookPage } from "./handbook.js";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TOKEN_COOKIE = "aicl_t";
const TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") return html(formPage());
    if (url.pathname === "/handbook" && request.method === "GET") return html(handbookPage());
    if (url.pathname === "/api/submit" && request.method === "POST") return submit(request, env);

    if (url.pathname === "/results" || url.pathname === "/results.csv") {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
      const denied = await checkAuth(request, env);
      if (denied) return denied;

      const day = DAY_RE.test(url.searchParams.get("day") || "") ? url.searchParams.get("day") : null;
      const stmt = day
        ? env.DB.prepare("SELECT answers, created_on FROM responses WHERE created_on = ? ORDER BY id").bind(day)
        : env.DB.prepare("SELECT answers, created_on FROM responses ORDER BY id");
      const { results } = await stmt.all();
      const rows = results.map(r => JSON.parse(r.answers));

      if (url.pathname === "/results.csv") {
        return new Response(resultsCsv(rows, results.map(r => r.created_on)), {
          headers: {
            "content-type": "text/csv; charset=utf-8",
            "content-disposition": `attachment; filename="ai-coding-checkin${day ? "-" + day : ""}.csv"`,
            "cache-control": "no-store",
          },
        });
      }
      const { results: days } = await env.DB
        .prepare("SELECT created_on AS day, COUNT(*) AS count FROM responses GROUP BY created_on ORDER BY created_on DESC")
        .all();
      return html(resultsPage(rows, days, day), { "cache-control": "no-store" });
    }

    return new Response("Not found", { status: 404 });
  },
};

function html(body, headers = {}) {
  return new Response(body, { headers: { "content-type": "text/html; charset=utf-8", ...headers } });
}

async function submit(request, env) {
  const text = await request.text();
  if (text.length > 8192) return new Response("Too large", { status: 413 });
  let body;
  try { body = JSON.parse(text); } catch { return new Response("Invalid JSON", { status: 400 }); }
  const answers = validate(body);
  if (!answers) return new Response("Invalid answers", { status: 400 });

  // Anonymous by design: only the answers, the UTC day and a hash of a random per-browser token are stored,
  // never IP, user agent or time of day. The token only lets a resubmission replace that browser's earlier answers.
  let token = readCookie(request, TOKEN_COOKIE);
  if (!token || !TOKEN_RE.test(token)) token = crypto.randomUUID();
  const day = new Date().toISOString().slice(0, 10);
  await env.DB.prepare(
    `INSERT INTO responses (answers, created_on, token_hash) VALUES (?, ?, ?)
     ON CONFLICT(token_hash) DO UPDATE SET answers = excluded.answers, created_on = excluded.created_on`
  ).bind(JSON.stringify(answers), day, await sha256Hex(token)).run();

  return new Response(null, {
    status: 204,
    headers: { "set-cookie": `${TOKEN_COOKIE}=${token}; Max-Age=${TOKEN_MAX_AGE}; Path=/; HttpOnly; Secure; SameSite=Strict` },
  });
}

function readCookie(request, name) {
  for (const part of (request.headers.get("Cookie") || "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

async function sha256Hex(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function checkAuth(request, env) {
  if (!env.RESULTS_PASSWORD) return new Response("Results are locked until the RESULTS_PASSWORD secret is set.", { status: 503 });
  const [scheme, encoded] = (request.headers.get("Authorization") || "").split(" ");
  if (scheme === "Basic" && encoded) {
    let decoded = "";
    try { decoded = atob(encoded); } catch {}
    const password = decoded.slice(decoded.indexOf(":") + 1);
    if (await sameSecret(password, env.RESULTS_PASSWORD)) return null;
  }
  return new Response("Password required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="AI coding check-in results", charset="UTF-8"' },
  });
}

// Hash both sides so timingSafeEqual gets equal-length inputs.
async function sameSecret(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  return crypto.subtle.timingSafeEqual(ha, hb);
}
