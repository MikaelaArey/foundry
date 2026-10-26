"use client";

import { useEffect, useState } from "react";

/** Show a short message at the bottom of the screen from anywhere in the client. */
export function toast(message: string) {
  window.dispatchEvent(new CustomEvent("foundry:toast", { detail: message }));
}

export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const on = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      clearTimeout(t);
      t = setTimeout(() => setMsg(null), 3200);
    };
    window.addEventListener("foundry:toast", on);
    return () => {
      window.removeEventListener("foundry:toast", on);
      clearTimeout(t);
    };
  }, []);
  return (
    <div aria-live="polite" role="status">
      {msg ? <div className="toast">{msg}</div> : null}
    </div>
  );
}
