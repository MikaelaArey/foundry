import { headers } from "next/headers";

/** The address people write to for help. Shown on the Support, Terms and Privacy pages. */
export const supportEmail = () => (process.env.SUPPORT_EMAIL ?? "").trim();

/** The iPhone app adds "FoundryApp" to its user agent (see capacitor.config.ts). */
export const NATIVE_UA_TOKEN = "FoundryApp";

export async function isNativeApp() {
  return ((await headers()).get("user-agent") ?? "").includes(NATIVE_UA_TOKEN);
}
