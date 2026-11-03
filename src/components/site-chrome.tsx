import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { APP_STORE_URL, isNativeApp } from "@/lib/config";
import { Brand } from "./ui";
import { Icon } from "./icon";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader({ current }: { current?: "explore" | "community" }) {
  const user = await getCurrentUser();
  return (
    <header className="site-header">
      <div className="container">
        <Brand />
        <nav className="nav-links" aria-label="Main">
          <Link href="/explore" aria-current={current === "explore" ? "page" : undefined}>
            Idea Database
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

/**
 * Apple's badge artwork, unaltered. Apple allows one per page and asks for 40px of height
 * at minimum, with a quarter of the badge's height as clear space. Hidden inside the iPhone app.
 */
export async function AppStoreBadge() {
  if (await isNativeApp()) return null;
  return (
    <a href={APP_STORE_URL} className="app-store-badge" target="_blank" rel="noopener noreferrer">
      <img src="/download-on-the-app-store.svg" alt="Download on the App Store" width={132} height={44} />
    </a>
  );
}

/** Pass appBadge on pages that don't already show the App Store badge. */
export async function SiteFooter({ appBadge = false }: { appBadge?: boolean }) {
  const native = await isNativeApp();
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
        {appBadge ? <AppStoreBadge /> : null}
        {native ? null : (
          <p className="site-footer-legal">
            Apple and the Apple logo are trademarks of Apple Inc., registered in the U.S. and other countries. App Store is a service mark of Apple
            Inc., registered in the U.S. and other countries.
          </p>
        )}
      </div>
    </footer>
  );
}
