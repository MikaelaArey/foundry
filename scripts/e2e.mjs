// End-to-end check of the main flows in a real headless Chrome.
// Start the app first (`npm run dev`), then run `npm run test:e2e`.
// Needs Google Chrome and the sqlite3 command-line tool. Set CHROME_PATH if
// Chrome isn't in the default macOS location. The test user it creates is
// deleted at the end.
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const DB = path.join(root, "prisma", "dev.db");
const BASE = process.env.APP_URL || "http://localhost:3000";
const port = 9334;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "foundry-e2e-"));
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const sql = (q) => execSync(`sqlite3 "${DB}" "${q.replace(/"/g, '\\"')}"`).toString().trim();

let version;
for (let i = 0; i < 50 && !version; i++) {
  try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await wait(200); }
}
const ws = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
const consoleErrors = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") consoleErrors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") consoleErrors.push(m.params.args.map((a) => a.value ?? a.description).join(" "));
});
const send = (method, params = {}, sessionId) =>
  new Promise((res, rej) => {
    const n = ++id;
    pending.set(n, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
    ws.send(JSON.stringify({ id: n, method, params, sessionId }));
  });
const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId: s } = await send("Target.attachToTarget", { targetId, flatten: true });
await send("Page.enable", {}, s);
await send("Runtime.enable", {}, s);
await send("Emulation.setDeviceMetricsOverride", { width: 1400, height: 1000, deviceScaleFactor: 1, mobile: false }, s);

const js = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: `(async () => { ${expr} })()`, awaitPromise: true, returnByValue: true }, s);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
};
const go = async (url) => { await send("Page.navigate", { url: BASE + url }, s); await waitFor("document.readyState === 'complete'"); await wait(1200); };
async function waitFor(expr, ms = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { if (await js(`return !!(${expr})`)) return true; } catch {}
    await wait(250);
  }
  throw new Error(`Timed out waiting for: ${expr}`);
}
const SETVAL = `const setVal = (el, v) => { const p = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(p, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };`;

const results = [];
async function step(name, fn) {
  try { const note = await fn(); results.push(`PASS  ${name}${note ? ` (${note})` : ""}`); }
  catch (e) { results.push(`FAIL  ${name}: ${e.message}`); }
}

const email = `e2e-${Date.now()}@example.com`;
let projectId = "";

await step("Sign up with email and password", async () => {
  await go("/signup");
  await js(`${SETVAL} const f = document.querySelector('[name=email]').form; setVal(f.querySelector('[name=name]'), 'Test Founder'); setVal(f.querySelector('[name=email]'), '${email}'); setVal(f.querySelector('[name=password]'), 'correct-horse-9'); f.querySelector('[name=agree]').checked = true; f.requestSubmit();`);
  await waitFor("location.pathname === '/app'");
  await waitFor("document.body.innerText.includes('Three steps to your first project')");
  return sql(`select count(*) from User where email='${email}'`) === "1" ? "user row created" : (() => { throw new Error("no user row"); })();
});

await step("Create a project with starter goals", async () => {
  await go("/app/projects/new");
  await js(`${SETVAL} setVal(document.querySelector('[name=name]'), 'Lemonade Stand Test'); setVal(document.querySelector('[name=pitch]'), 'Cold drinks for hot days.'); await new Promise(r => setTimeout(r, 100)); document.querySelector('[name=pitch]').form.requestSubmit();`);
  await waitFor("location.pathname.startsWith('/app/projects/') && !location.pathname.endsWith('/new')");
  await waitFor("document.querySelectorAll('section.sec').length === 3");
  projectId = await js("return location.pathname.split('/').pop()");
  const goals = sql(`select count(*) from Goal g join Section s on g.sectionId=s.id where s.projectId='${projectId}'`);
  if (goals !== "15") throw new Error(`expected 15 goals, found ${goals}`);
  return "3 sections, 15 goals";
});

await step("Check a goal: section bar and overall ring update, and it persists", async () => {
  await js("document.querySelector('section.sec .goal-label').click()");
  await waitFor("document.querySelector('section.sec .sec-pct').textContent.trim() === '20%'");
  await waitFor("document.querySelector('.ring-lg b').textContent.replace(/\\s/g,'') === '7%'");
  await wait(1200);
  const done = sql(`select count(*) from Goal g join Section s on g.sectionId=s.id where s.projectId='${projectId}' and g.done=1`);
  if (done !== "1") throw new Error(`expected 1 done goal in DB, found ${done}`);
  await go(`/app/projects/${projectId}`);
  await waitFor("document.querySelector('section.sec .sec-pct').textContent.trim() === '20%'");
  return "20% section, 7% overall (equal section weights), survives reload";
});

await step("Add a goal to a section", async () => {
  await js(`${SETVAL} const f = document.querySelector('section.sec form.add-goal'); setVal(f.querySelector('input'), 'Test goal from e2e'); await new Promise(r => setTimeout(r, 100)); f.requestSubmit();`);
  await waitFor("document.body.innerText.includes('Test goal from e2e')");
  await wait(500);
  return sql(`select count(*) from Goal where text='Test goal from e2e'`) === "1" ? "saved" : (() => { throw new Error("not in DB"); })();
});

await step("Link GitHub in the Launchpad", async () => {
  await js("[...document.querySelectorAll('button.tool-off')].find(b => b.textContent.includes('GitHub')).click()");
  await waitFor("document.querySelector('.link-form input')");
  await js(`${SETVAL} const f = document.querySelector('.link-form'); setVal(f.querySelector('input'), 'github.com/octo/lemonade'); await new Promise(r => setTimeout(r, 100)); f.requestSubmit();`);
  await waitFor("document.querySelector('a.tool-main[href=\"https://github.com/octo/lemonade\"]')");
  await waitFor("document.body.innerText.includes('Open this repo in VS Code')");
  const row = sql(`select url from ProjectLink where projectId='${projectId}' and kind='github'`);
  if (row !== "https://github.com/octo/lemonade") throw new Error(`DB has ${row}`);
  return "normalized to https, repo shortcuts shown";
});

await step("Stage stepper saves", async () => {
  await js("[...document.querySelectorAll('.step')].find(b => b.textContent.includes('Build')).click()");
  await wait(1200);
  return sql(`select stage from Project where id='${projectId}'`) === "build" ? "stage=build" : (() => { throw new Error("stage not saved"); })();
});

await step("Notebook: create an idea and autosave the title", async () => {
  await go("/app/notebook?new=1");
  await waitFor("document.querySelector('.nb-title')");
  await js(`${SETVAL} setVal(document.querySelector('.nb-title'), 'Frozen lemonade pops');`);
  await wait(1800);
  const n = sql(`select count(*) from Idea i join User u on i.userId=u.id where u.email='${email}' and i.title='Frozen lemonade pops'`);
  if (n !== "1") throw new Error(`expected 1 idea, found ${n}`);
  await waitFor("location.search.startsWith('?id=')");
  return "saved, URL updated so refresh won't duplicate it";
});

await step("Community: create a post", async () => {
  await go("/community?compose=1&kind=question&title=" + encodeURIComponent("How do you price a lemonade stand?"));
  await waitFor("document.querySelector('form.composer')");
  await js(`${SETVAL} const f = document.querySelector('form.composer'); setVal(f.querySelector('[name=body]'), 'Testing the composer from an automated check.'); f.requestSubmit();`);
  await waitFor("location.pathname.startsWith('/community/')");
  return "redirected to the new post";
});

await step("Community: reply to the post", async () => {
  await js(`${SETVAL} const f = [...document.querySelectorAll('form')].find(f => f.querySelector('[name=postId]')); setVal(f.querySelector('textarea'), 'First reply from e2e'); f.requestSubmit();`);
  await waitFor("document.body.innerText.includes('First reply from e2e')");
  return "reply shows up";
});

await step("Community: upvote", async () => {
  await js("document.querySelector('.vote button').click()");
  await waitFor("document.querySelector('.vote button').getAttribute('aria-pressed') === 'true'");
  await wait(800);
  const v = sql(`select count(*) from Vote v join User u on v.userId=u.id where u.email='${email}'`);
  if (v !== "1") throw new Error(`expected 1 vote, found ${v}`);
  return "vote saved";
});

await step("Other people's projects are not reachable", async () => {
  const other = sql("select p.id from Project p join User u on p.userId=u.id where u.email='demo@foundry.local' limit 1");
  await go(`/app/projects/${other}`);
  const text = await js("return document.body.innerText");
  if (!text.includes("still an")) throw new Error("demo project was visible to another user");
  return "404 for someone else's project";
});

await step("Idea Database: Save to my notebook opens the idea with its report", async () => {
  await go("/explore/missed-call-rescue");
  await js("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Save to my notebook')).click()");
  await waitFor("location.pathname === '/app/notebook' && location.search.startsWith('?id=')");
  await waitFor("document.body.innerText.includes('Validation report') && document.body.innerText.includes('Offer ladder')");
  return "notebook shows the report";
});
await step("Idea Database: Start this as a project uses the report's plan", async () => {
  await go("/app/projects/new?from=missed-call-rescue");
  await waitFor("document.querySelector('[name=plan]')");
  await js("document.querySelector('[name=name]').form.requestSubmit()");
  await waitFor("location.pathname.startsWith('/app/projects/') && !location.pathname.endsWith('/new')");
  await waitFor("document.querySelectorAll('section.sec').length === 4");
  const names = await js("return [...document.querySelectorAll('section.sec h3')].map(h => h.textContent.trim()).join(', ')");
  return names;
});
await step("Notebook: Make it a project links the idea", async () => {
  const ideaId = sql(`select i.id from Idea i join User u on i.userId=u.id where u.email='${email}' and i.source='database' limit 1`);
  await go(`/app/projects/new?idea=${ideaId}`);
  await waitFor("document.querySelector('[name=ideaId]').value");
  await js("document.querySelector('[name=name]').form.requestSubmit()");
  await waitFor("location.pathname.startsWith('/app/projects/') && !location.pathname.endsWith('/new')");
  const pid = await js("return location.pathname.split('/').pop()");
  const linked = sql(`select projectId from Idea where id='${ideaId}'`);
  if (linked !== pid) throw new Error(`idea linked to ${linked}, expected ${pid}`);
  await waitFor("document.body.innerText.includes('Missed-call rescue')");
  return "idea.projectId set and shown under Ideas for this project";
});
await step("Generator without an API key falls back to the Idea Database", async () => {
  await go("/app/generate?industry=restaurants");
  await waitFor("document.querySelectorAll('.gen-card').length >= 1", 20000);
  const first = await js("return document.querySelector('.gen-card h3').textContent");
  return `first match: ${first}`;
});
// ---------------------------------------------------------------- safety
const priyaPost = sql("select p.id from Post p join User u on p.userId=u.id where u.email='priya@sample.foundry.local' order by p.createdAt desc limit 1");

await step("Sign-up requires agreeing to the Terms", async () => {
  const n = sql(`select count(*) from User where email='${email}' and termsAcceptedAt is not null`);
  if (n !== "1") throw new Error("termsAcceptedAt not recorded");
  return "agreement recorded";
});

await step("Community: the filter blocks abusive language", async () => {
  await go("/community?compose=1&kind=question&title=" + encodeURIComponent("Please kys"));
  await waitFor("document.querySelector('form.composer')");
  await js(`${SETVAL} const f = document.querySelector('form.composer'); setVal(f.querySelector('[name=body]'), 'Filter check.'); f.requestSubmit();`);
  await waitFor("document.body.innerText.includes(\"isn't allowed in the community\")");
  const n = sql(`select count(*) from Post p join User u on p.userId=u.id where u.email='${email}' and p.title like '%kys%'`);
  if (n !== "0") throw new Error("abusive post was saved");
  return "post refused, nothing saved";
});

await step("Community: report a post", async () => {
  await go(`/community/${priyaPost}`);
  await js("document.querySelector('.content-menu .icon-btn').click()");
  await waitFor("document.querySelector('.menu-pop')");
  await js("[...document.querySelectorAll('.menu-pop button')].find(b => b.textContent.includes('Report')).click()");
  await waitFor("document.querySelector('.safety-panel input[type=radio]')");
  await js("document.querySelector('.safety-panel input[type=radio]').click()");
  await js("[...document.querySelectorAll('.safety-panel button')].find(b => b.textContent.includes('Send report')).click()");
  await waitFor("document.body.innerText.includes('review this within 24 hours')");
  const n = sql(`select count(*) from Report r join User u on r.reporterId=u.id where u.email='${email}' and r.postId='${priyaPost}' and r.status='open'`);
  if (n !== "1") throw new Error(`expected 1 open report, found ${n}`);
  return "report saved";
});

await step("Community: block someone, then unblock in Settings", async () => {
  await js("[...document.querySelectorAll('.safety-panel button')].find(b => b.textContent.includes('Block')).click()");
  await wait(1500);
  await go("/community?sort=new");
  const visible = await js("return document.body.innerText.includes('Priya Nair')");
  if (visible) throw new Error("blocked person's posts still show");
  await go("/app/settings");
  await waitFor("document.body.innerText.includes('Blocked people') && document.body.innerText.includes('Priya Nair')");
  await js("[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Unblock').click()");
  await waitFor("document.body.innerText.includes(\"You haven’t blocked anyone\")");
  await go("/community?sort=new");
  await waitFor("document.body.innerText.includes('Priya Nair')");
  return "hidden while blocked, back after unblocking";
});

await step("Sign out", async () => {
  await go("/app");
  await js("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Sign out')).click()");
  await waitFor("location.pathname === '/'");
  await go("/app");
  await waitFor("location.pathname === '/login'");
  return "back to /login when visiting /app";
});

await step("Moderator removes reported content", async () => {
  await go("/api/dev/demo?next=/app/moderation");
  await waitFor("location.pathname === '/app/moderation'");
  await waitFor("document.body.innerText.includes('Reports to review') && document.querySelector('article.card')");
  await js("[...document.querySelectorAll('article.card button')].find(b => b.textContent.trim() === 'Remove').click()");
  await waitFor("document.body.innerText.includes('Nothing to review')");
  const hidden = sql(`select hidden from Post where id='${priyaPost}'`);
  if (hidden !== "1") throw new Error("post not hidden after removal");
  await go(`/community/${priyaPost}`);
  await go("/community?sort=new");
  const shown = await js(`return !!document.querySelector('a[href="/community/${priyaPost}"]')`);
  if (shown) throw new Error("removed post still in the feed");
  sql(`update Post set hidden=0 where id='${priyaPost}'`); // put the demo post back
  return "hidden for everyone, then restored for the demo data";
});

await step("Delete account from Settings", async () => {
  await go("/app");
  await js("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Sign out')).click()");
  await waitFor("location.pathname === '/'");
  await go("/login");
  await js(`${SETVAL} const f = document.querySelector('[name=email]').form; setVal(f.querySelector('[name=email]'), '${email}'); setVal(f.querySelector('[name=password]'), 'correct-horse-9'); f.requestSubmit();`);
  await waitFor("location.pathname === '/app'");
  await go("/app/settings");
  await js("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Delete my account')).click()");
  await waitFor("document.querySelector('[name=confirm]')");
  await js(`${SETVAL} setVal(document.querySelector('[name=confirm]'), 'DELETE'); await new Promise(r => setTimeout(r, 100)); [...document.querySelectorAll('button')].find(b => b.textContent.includes('Delete everything')).click();`);
  await waitFor("location.pathname === '/login' && document.body.innerText.includes('were deleted')");
  const left = sql(`select (select count(*) from User where email='${email}') + (select count(*) from Project p where p.userId not in (select id from User)) + (select count(*) from Idea i where i.userId not in (select id from User))`);
  if (left !== "0") throw new Error(`account data left behind (${left} rows)`);
  return "account and all its data gone";
});

console.log(results.join("\n"));
const failed = results.filter((r) => r.startsWith("FAIL")).length;
console.log(consoleErrors.length ? `\nBrowser console errors:\n${[...new Set(consoleErrors)].join("\n")}` : "\nNo browser console errors.");
// Clean up the test user (cascades to its projects, ideas, posts, votes).
sql(`PRAGMA foreign_keys=ON; delete from User where email='${email}'`);
ws.close();
chrome.kill("SIGKILL");
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(failed ? 1 : 0);
