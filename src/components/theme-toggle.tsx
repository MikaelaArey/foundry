"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icon";

type Mode = "system" | "light" | "dark";
const KEY = "foundry-theme";

export const themeScript = `try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export function ThemeToggle({ compact }: { compact?: boolean }) {
  const [mode, setMode] = useState<Mode>("system");
  useEffect(() => {
    try {
      const t = localStorage.getItem(KEY);
      if (t === "light" || t === "dark") setMode(t);
    } catch {}
  }, []);

  const next: Record<Mode, Mode> = { system: "light", light: "dark", dark: "system" };
  const labels: Record<Mode, string> = { system: "System theme", light: "Light theme", dark: "Dark theme" };
  const icons: Record<Mode, string> = { system: "monitor", light: "sun", dark: "moon" };

  function cycle() {
    const m = next[mode];
    setMode(m);
    try {
      if (m === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, m);
    } catch {}
    if (m === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = m;
  }

  return compact ? (
    <button className="icon-btn" onClick={cycle} aria-label={`${labels[mode]}. Click to switch.`} title={labels[mode]}>
      <Icon name={icons[mode]} />
    </button>
  ) : (
    <button className="side-link" onClick={cycle} style={{ border: 0, background: "none", width: "100%", cursor: "pointer" }}>
      <Icon name={icons[mode]} /> {labels[mode]}
    </button>
  );
}
