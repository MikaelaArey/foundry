import Link from "next/link";
import { Icon } from "@/components/icon";

export default function NotFound() {
  return (
    <main className="container" style={{ minHeight: "80vh", display: "grid", placeItems: "center", textAlign: "center" }}>
      <div className="stack gap-16" style={{ alignItems: "center" }}>
        <span className="eyebrow">404</span>
        <h1 className="display-l">
          This page is still an <span className="grad italic">idea</span>.
        </h1>
        <p className="lead">It may have been deleted, or the link is out of date.</p>
        <Link href="/" className="btn btn-primary">
          <Icon name="back" /> Back to Foundry
        </Link>
      </div>
    </main>
  );
}
