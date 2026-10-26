import { LEGAL_UPDATED, SupportEmail } from "@/components/contact";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <span className="eyebrow">Last updated {LEGAL_UPDATED}</span>
      <h1 className="display-l">Privacy Policy</h1>
      <p className="lead">
        Foundry is a workspace for entrepreneurs. This page explains what we collect when you use the Foundry website or iPhone app, why, and how
        to delete it. The short version: we keep what you put into Foundry so the app works, we don&rsquo;t sell it, and we don&rsquo;t track you
        for advertising.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <b>Account details:</b> your name, email address, handle and bio. Your password is stored only as a one-way hash, so nobody, including
          us, can read it.
        </li>
        <li>
          <b>What you create:</b> projects, sections, goals, links, notebook ideas, validation reports, community posts, replies, votes, and any
          reports you file about other people&rsquo;s posts.
        </li>
        <li>
          <b>GitHub, if you connect it:</b> your GitHub username and an access token, stored encrypted. We use the token only to list your
          repositories so you can link one to a project.
        </li>
        <li>
          <b>A sign-in cookie</b> that keeps you logged in. We don&rsquo;t use advertising or analytics cookies.
        </li>
        <li>
          <b>Basic technical logs</b> kept by our hosting provider, such as IP addresses and error messages, used to keep the service running
          and secure.
        </li>
      </ul>
      <p>
        In the iPhone app, daily reminders are scheduled on your phone. Turning them on or off doesn&rsquo;t send anything to us.
      </p>

      <h2>How we use it</h2>
      <ul>
        <li>To run Foundry: show your projects and ideas, keep your work in sync, and sign you in.</li>
        <li>To keep the community safe: review reports, remove content that breaks the rules, and stop abuse.</li>
        <li>To answer you when you contact support.</li>
      </ul>
      <p>We don&rsquo;t sell your information, show ads, or share your information with advertisers or data brokers.</p>

      <h2>AI features</h2>
      <p>
        When you use an AI feature, such as validating an idea or suggesting goals, the text needed for that request (for
        example the idea&rsquo;s title and notes) is sent to Anthropic, the company that makes Claude, to produce the result. It&rsquo;s only
        sent when you ask for an AI feature. Anthropic&rsquo;s commercial terms don&rsquo;t allow it to train its models on this data.
      </p>

      <h2>Who can see what</h2>
      <ul>
        <li>Your projects, goals and notebook ideas are private to you.</li>
        <li>Community posts and replies are public, along with your name, handle and bio.</li>
        <li>
          Service providers who run parts of Foundry for us (hosting, database, Anthropic for AI features, and GitHub if you connect it) process
          data only to provide their service.
        </li>
        <li>We may share information if the law requires it, or to protect people from harm.</li>
      </ul>

      <h2>Keeping and deleting your data</h2>
      <p>
        We keep your data while you have an account. You can delete your account at any time in <b>Settings → Delete account</b>, on the web or in
        the app. That immediately and permanently deletes your account and everything in it: projects, ideas, posts, replies, votes and reports.
        Copies in our providers&rsquo; backups are erased within 30 days.
      </p>

      <h2>Your choices</h2>
      <p>
        You can see and edit your information in Foundry at any time. To ask for a copy of your data, or for help correcting or deleting it,
        email <SupportEmail />.
      </p>

      <h2>Children</h2>
      <p>Foundry isn&rsquo;t meant for children under 13, and we don&rsquo;t knowingly collect information from them.</p>

      <h2>Changes</h2>
      <p>If we change this policy, we&rsquo;ll update the date at the top. For important changes we&rsquo;ll let you know in the app.</p>

      <h2>Contact</h2>
      <p>
        Questions about privacy: <SupportEmail />.
      </p>
    </>
  );
}
