import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Brand } from "./ui";
import { Icon } from "./icon";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader({ current }: { current?: "explore" | "community" | "generate" }) {
  const user = await getCurrentUser();
  return (
    <header className="site-header">
      <div className="container">
        <Brand />
        <nav className="nav-links" aria-label="Main">
          <Link href="/explore" aria-current={current === "explore" ? "page" : undefined}>
            Idea Database
          </Link>
          <Link href="/app/generate" aria-current={current === "generate" ? "page" : undefined}>
            Generator
          </Link>
          <Link href="/community" aria-current={current === "community" ? "page" : undefined}>
            Community
          </Link>
        </nav>
        <div className="header-actions">
          <ThemeToggle compact />
          {user ? (
            <Link href="/app" className="btn btn-primary btn-sm">
              Open Foundry <Icon name="arrow" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-sm hide-sm">
                Log in
              </Link>
              <Link href="/signup" className="btn btn-primary btn-sm">
                Get started free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <Brand />
        <nav className="row-wrap" style={{ gap: 18 }} aria-label="Footer">
          <Link href="/explore">Idea Database</Link>
          <Link href="/community">Community</Link>
          <Link href="/support">Support</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
        <span>Free for founders while in beta.</span>
      </div>
    </footer>
  );
}
