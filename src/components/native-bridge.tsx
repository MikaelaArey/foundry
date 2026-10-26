"use client";

import { useEffect } from "react";
import { hideSplash, isNative, openExternal, syncStatusBar } from "@/lib/native";

/**
 * Runs inside the iPhone app only: opens outside links in the in-app browser,
 * keeps the status bar readable in light and dark mode, and marks the page so
 * CSS can make room for the tab bar and the notch.
 */
export function NativeBridge() {
  useEffect(() => {
    if (!isNative()) return;
    document.documentElement.classList.add("native-app");
    void hideSplash();

    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || e.defaultPrevented) return;
      const url = new URL(a.href, location.href);
      if ((url.protocol === "http:" || url.protocol === "https:") && url.origin !== location.origin) {
        e.preventDefault();
        void openExternal(url.href);
      }
    };
    document.addEventListener("click", onClick, true);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      const forced = document.documentElement.dataset.theme;
      void syncStatusBar(forced ? forced === "dark" : media.matches);
    };
    sync();
    media.addEventListener("change", sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      document.removeEventListener("click", onClick, true);
      media.removeEventListener("change", sync);
      observer.disconnect();
    };
  }, []);
  return null;
}
