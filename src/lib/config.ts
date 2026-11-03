import { headers } from "next/headers";

/** The address people write to for help. Shown on the Support, Terms and Privacy pages. */
export const supportEmail = () => (process.env.SUPPORT_EMAIL ?? "").trim();

/** Foundry's App Store listing. With no country in the link, Apple picks the visitor's own store. */
export const APP_STORE_ID = "6826970307";
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;

/** The iPhone app adds "FoundryApp" to its user agent (see capacitor.config.ts). */
export const NATIVE_UA_TOKEN = "FoundryApp";

export async function isNativeApp() {
  return ((await headers()).get("user-agent") ?? "").includes(NATIVE_UA_TOKEN);
}
