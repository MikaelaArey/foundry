// Prepares the iPhone project: records which Foundry address the app loads,
// then copies the settings and plugins into ios/ (npx cap sync ios).
// Usage:
//   npm run ios:sync                                   (simulator, loads http://localhost:3000)
//   FOUNDRY_APP_URL=https://your-domain npm run ios:sync  (App Store builds)
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const url = (process.env.FOUNDRY_APP_URL || "http://localhost:3000").replace(/\/$/, "");
if (!/^https?:\/\//.test(url)) throw new Error(`FOUNDRY_APP_URL must start with http:// or https:// (got "${url}")`);
if (url.startsWith("http://") && !/localhost|127\.0\.0\.1/.test(url)) {
  console.warn("Warning: App Store builds must load an https:// address.");
}

fs.writeFileSync(path.join(root, "mobile", "www", "config.js"), `window.FOUNDRY_APP_URL = ${JSON.stringify(url)};\n`);
console.log(`The app will load ${url}`);
execSync("npx cap sync ios", { cwd: root, stdio: "inherit", env: { ...process.env, FOUNDRY_APP_URL: url } });
