import Link from "next/link";
import type { CSSProperties } from "react";
import { Icon } from "./icon";
import { hueOf, initials } from "@/lib/utils";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="brand" aria-label="Foundry home">
      <span className="brand-mark">
        <Icon name="bolt" filled />
      </span>
      Foundry
    </Link>
  );
}

export function Avatar({ name, seed, size = 32 }: { name: string; seed?: string; size?: number }) {
  const h = hueOf(seed ?? name);
  const style = {
    "--size": `${size}px`,
    background: `linear-gradient(135deg, hsl(${h} 72% 58%), hsl(${(h + 48) % 360} 70% 46%))`,
  } as CSSProperties;
  return (
    <span className="avatar" style={style} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

/** Circular progress. Uses the #ringGrad gradient defined in the root layout. */
export function Ring({ pct, large, label }: { pct: number; large?: boolean; label?: string }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className={large ? "ring ring-lg" : "ring"} role="img" aria-label={label ?? `${pct}% complete`}>
      <svg viewBox="0 0 52 52">
        <circle className="track" cx="26" cy="26" r={r} fill="none" strokeWidth={large ? 4.5 : 5.5} />
        <circle
          className="val"
          cx="26"
          cy="26"
          r={r}
          fill="none"
          strokeWidth={large ? 4.5 : 5.5}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(100, Math.max(0, pct)) / 100)}
        />
      </svg>
      <b>
        <span>
          {pct}
          {large ? <small>%</small> : "%"}
        </span>
      </b>
    </div>
  );
}

export function Bar({ pct, large }: { pct: number; large?: boolean }) {
  return (
    <span className={large ? "bar bar-lg" : "bar"}>
      <i style={{ width: `${pct}%` }} />
    </span>
  );
}

export function Empty({ icon, title, children }: { icon: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="empty">
      <Icon name={icon} />
      <b>{title}</b>
      {children}
    </div>
  );
}
