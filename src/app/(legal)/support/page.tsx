import Link from "next/link";
import { SupportEmail } from "@/components/contact";

export const metadata = { title: "Support" };

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "I forgot my password.",
    a: (
      <>
        Email us from the address on your account and we&rsquo;ll reset it for you. Self-service password reset is coming soon.
      </>
    ),
  },
  {
    q: "How do I delete my account?",
    a: (
      <>
        Open <b>Settings</b>, scroll to <b>Delete account</b>, type DELETE and confirm. Your account and everything in it are deleted right away.
      </>
    ),
  },
  {
    q: "How do I report a post or block someone?",
    a: (
      <>
        Tap the <b>⋯</b> button next to any community post or reply, then choose <b>Report</b> or <b>Block</b>. Blocked people&rsquo;s posts and
        replies disappear for you. You can unblock people in Settings. We review every report within 24 hours.
      </>
    ),
  },
  {
    q: "How is overall project progress calculated?",
    a: <>Each section counts equally. Overall progress is the average of your sections&rsquo; progress. Empty sections count once they have a goal.</>,
  },
  {
    q: "How do I turn daily reminders on or off?",
    a: (
      <>
        In the iPhone app, open <b>Settings</b> and use the <b>Daily reminder</b> switch. You can also turn off Foundry notifications in your
        iPhone&rsquo;s Settings app.
      </>
    ),
  },
  {
    q: "Is Foundry free?",
    a: <>Yes. Foundry is free while it&rsquo;s in beta.</>,
  },
];

export default function SupportPage() {
  return (
    <>
      <span className="eyebrow">Support</span>
      <h1 className="display-l">How can we help?</h1>
      <p className="lead">
        Email <SupportEmail /> and a real person will answer, usually within one business day. For safety issues in the community, use{" "}
        <b>Report</b> on the post, and we&rsquo;ll review it within 24 hours.
      </p>

      <h2>Common questions</h2>
      <div className="stack gap-16">
        {FAQ.map((f) => (
          <section key={f.q} className="card card-pad stack gap-6">
            <b>{f.q}</b>
            <p className="soft">{f.a}</p>
          </section>
        ))}
      </div>

      <h2>More</h2>
      <p>
        <Link className="link" href="/terms">
          Terms of Use
        </Link>{" "}
        ·{" "}
        <Link className="link" href="/privacy">
          Privacy Policy
        </Link>{" "}
        ·{" "}
        <Link className="link" href="/terms#community-rules">
          Community rules
        </Link>
      </p>
    </>
  );
}
