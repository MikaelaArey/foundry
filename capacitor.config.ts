import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The Foundry iPhone app is a native shell around the live Foundry website.
 *
 * FOUNDRY_APP_URL is the address it loads. Use your live https:// address for
 * App Store builds (for example https://foundry.example.com). Without it, the
 * app loads http://localhost:3000, which works in the iPhone simulator while
 * `npm run dev` is running on this Mac.
 *
 * After changing anything here, run `npm run ios:sync`.
 */
const appUrl = (process.env.FOUNDRY_APP_URL || "http://localhost:3000").replace(/\/$/, "");
const local = appUrl.startsWith("http://");

const config: CapacitorConfig = {
  // The bundle ID. It must match the app you create in App Store Connect and
  // can't be changed after the first upload.
  appId: "com.mikaelaarey.foundry",
  appName: "Foundry",
  webDir: "mobile/www",
  // Lets the website know it's running inside the app (see src/lib/config.ts).
  appendUserAgent: "FoundryApp",
  backgroundColor: "#fafafc",
  server: {
    url: appUrl,
    cleartext: local,
    // Shown when the site can't be reached, for example with no internet.
    errorPath: "offline.html",
  },
  ios: {
    contentInset: "never",
    preferredContentMode: "mobile",
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000, // Foundry hides it sooner, as soon as the page has loaded
      launchAutoHide: true,
      backgroundColor: "#5a45f2",
      showSpinner: false,
    },
    LocalNotifications: {
      iconColor: "#5a45f2",
    },
  },
};

export default config;
