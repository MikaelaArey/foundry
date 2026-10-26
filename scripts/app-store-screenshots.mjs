// Captures App Store screenshots: the app as it appears on a 6.9" iPhone
// (1320 x 2868 pixels), saved to docs/app-store/screenshots.
// Start the app with demo data first (`npm run setup` and `npm run dev`), then
// run `npm run screenshots:app-store`. Needs Google Chrome; set CHROME_PATH if
// it isn't in the default macOS location.
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = path.join(root, "docs", "app-store", "screenshots");
const BASE = process.env.APP_URL || "http://localhost:3000";
fs.mkdirSync(OUT, { recursive: true });
const port = 9333;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "foundry-shots-"));

// Screens to capture, in App Store order. Signed-in screens use the demo account.
const jobs = [
  { name: "1-home", url: "/app" },
  { name: "2-project", url: "/app/projects/:coffee" },
  { name: "3-notebook", url: "/app/notebook?id=:nurses" },
  { name: "4-sections", url: "/app/projects/:coffee", scrollTo: ".sections-grid" },
  { name: "5-idea-report", url: "/explore/missed-call-rescue" },
  { name: "6-community", url: "/community" },
];
// An iPhone browser identity plus the app's own marker, so the site renders exactly as in the app.
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 FoundryApp";

const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let version;
for (let i = 0; i < 50 && !version; i++) {
  try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await wait(200); }
}
const ws = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
const listeners = [];
ws.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  else listeners.forEach((l) => l(msg));
});
const send = (method, params = {}, sessionId) =>
  new Promise((res, rej) => {
    const m = ++id;
    pending.set(m, (msg) => (msg.error ? rej(new Error(`${method}: ${msg.error.message}`)) : res(msg.result)));
    ws.send(JSON.stringify({ id: m, method, params, sessionId }));
  });

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
await send("Page.enable", {}, sessionId);
const loaded = () => new Promise((r) => { const l = (m) => { if (m.method === "Page.loadEventFired" && m.sessionId === sessionId) { listeners.splice(listeners.indexOf(l), 1); r(); } }; listeners.push(l); });
async function go(url) { const p = loaded(); await send("Page.navigate", { url }, sessionId); await Promise.race([p, wait(20000)]); await wait(1800); }

// Fill in demo record ids for URLs like /app/projects/:coffee.
const DB = path.join(root, "prisma", "dev.db");
const sql = (q) => execSync(`sqlite3 "${DB}" "${q}"`).toString().trim();
const ids = {
  coffee: sql("select p.id from Project p join User u on p.userId=u.id where u.email='demo@foundry.local' and p.name like 'Corner Cup%' limit 1"),
  nurses: sql("select i.id from Idea i join User u on i.userId=u.id where u.email='demo@foundry.local' and i.title like 'Meal kits%' limit 1"),
};
const resolve = (url) => BASE + url.replace(/:(\w+)/g, (_, k) => ids[k] ?? k);

await send("Emulation.setUserAgentOverride", { userAgent: UA, platform: "iPhone" }, sessionId);
let signedIn = false;
for (const j of jobs) {
  if (j.login !== false && !signedIn) {
    await go(`${BASE}/api/dev/demo?next=/app`);
    signedIn = true;
  }
  const w = 440, h = 956; // iPhone 6.9" in points; x3 = 1320 x 2868 pixels
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 3, mobile: true }, sessionId);
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: j.dark ? "dark" : "light" }, { name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);
  await go(resolve(j.url));
  if (j.after) await wait(j.after);
  if (j.scrollTo) {
    await send("Runtime.evaluate", { expression: `(() => { const el = document.querySelector(${JSON.stringify(j.scrollTo)}); if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 90); })()` }, sessionId);
    await wait(600);
  }
  let clip;
  if (j.full) {
    const { cssContentSize } = await send("Page.getLayoutMetrics", {}, sessionId);
    clip = { x: 0, y: 0, width: w, height: Math.min(cssContentSize.height, 5000), scale: 1 };
  }
  const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: !!j.full, ...(clip ? { clip } : {}) }, sessionId);
  fs.writeFileSync(path.join(OUT, `${j.name}.png`), Buffer.from(data, "base64"));
  console.log("saved", j.name);
}
ws.close();
chrome.kill("SIGKILL");
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);
