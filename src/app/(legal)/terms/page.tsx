import Link from "next/link";
import { LEGAL_UPDATED, SupportEmail } from "@/components/contact";

export const metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <>
      <span className="eyebrow">Last updated {LEGAL_UPDATED}</span>
      <h1 className="display-l">Terms of Use</h1>
      <p className="lead">
        These terms are the agreement between you and Foundry when you use the Foundry website or iPhone app. By creating an account, you agree
        to them.
      </p>

      <h2>Who can use Foundry</h2>
      <p>
        You need to be at least 13 years old, and old enough to agree to these terms where you live. Keep your password safe. You&rsquo;re
        responsible for what happens in your account.
      </p>

      <h2>Your content</h2>
      <p>
        You own what you create in Foundry. You give us permission to store it, process it and show it back to you, and to show your community
        posts and replies to other people, so the service works. You can delete your content, or your whole account, at any time.
      </p>

      <h2 id="community-rules">Community rules</h2>
      <p>
        Foundry has <b>zero tolerance for objectionable content or abusive users.</b> In the community, don&rsquo;t post:
      </p>
      <ul>
        <li>harassment, bullying, hate speech, or attacks on people for who they are</li>
        <li>threats, or content that encourages violence or self-harm</li>
        <li>sexual or pornographic content</li>
        <li>spam, scams, or misleading promotions</li>
        <li>other people&rsquo;s private information, or content you don&rsquo;t have the right to share</li>
        <li>anything illegal</li>
      </ul>
      <p>
        Anyone can report a post or reply, or block a person, from the <b>⋯</b> menu next to it. A filter blocks clearly abusive language before
        it&rsquo;s posted. We review reports within 24 hours, remove content that breaks these rules, and ban people who post it. Content that
        several people report is hidden until we review it.
      </p>

      <h2>AI features and idea reports</h2>
      <p>
        Validation reports, scores and suggested goals are meant to help you think. They aren&rsquo;t financial, legal or
        professional advice, and they can be wrong. Check important decisions with real customers and qualified advisors.
      </p>

      <h2>Connected tools</h2>
      <p>
        Launchpad links and GitHub open other services, which have their own terms. We&rsquo;re not responsible for those services.
      </p>

      <h2>The service</h2>
      <p>
        Foundry is free while it&rsquo;s in beta. We may change, add or remove features. If we ever introduce paid plans, we&rsquo;ll tell you
        first, and nothing will be charged without your agreement.
      </p>

      <h2>Ending your use</h2>
      <p>
        You can stop using Foundry and delete your account at any time in Settings. We may suspend or close accounts that break these terms or
        put other people at risk.
      </p>

      <h2>Disclaimers</h2>
      <p>
        Foundry is provided &ldquo;as is&rdquo;. We work hard to keep it running and your data safe, but we can&rsquo;t promise it will always be
        available or error-free. To the extent the law allows, Foundry isn&rsquo;t liable for indirect or consequential losses, such as lost
        profits or lost business opportunities.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        If we change these terms, we&rsquo;ll update the date at the top and let you know in the app. If you keep using Foundry after a change,
        you accept the new terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <SupportEmail />. See also our <Link className="link" href="/privacy">Privacy Policy</Link>.
      </p>
    </>
  );
}
