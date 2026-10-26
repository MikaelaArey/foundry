import { supportEmail } from "@/lib/config";

/** The support address as a link, or a note when it hasn't been configured. */
export function SupportEmail() {
  const email = supportEmail();
  return email ? (
    <a className="link" href={`mailto:${email}`}>
      {email}
    </a>
  ) : (
    <span className="muted">the support address (not set up yet: add SUPPORT_EMAIL to the server settings)</span>
  );
}

export const LEGAL_UPDATED = "October 25, 2026";
