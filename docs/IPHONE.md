# Foundry for iPhone

The iPhone app lives in `ios/`. It's a native app (built with Capacitor) that shows the live Foundry site and adds phone features: haptic feedback, a daily reminder, an in-app browser for outside links, an offline screen, and a native tab bar layout.

Do the steps in order. You need Foundry online first (see `DEPLOY.md`).

## What's already done

- [x] iPhone project with the Foundry icon and launch screen (`ios/App`)
- [x] iPhone only, portrait only
- [x] Privacy manifest and the "no special encryption" declaration (so App Store Connect skips the export question)
- [x] Apple's requirements inside Foundry: account deletion, Terms of Use with community rules, Privacy Policy, Support page, report and block on every community post and reply, a word filter, auto-hiding of content reported by 3 people, a moderation page, and no third-party sign-in inside the app
- [x] App Store listing text, privacy answers and review notes (`docs/app-store/LISTING.md`)
- [x] Six screenshots at the required 6.9" size (`docs/app-store/screenshots/`)
- [x] Xcode 26.6 and the iOS 26.5 simulator installed. The app builds with no errors and runs in the iPhone 17 Pro simulator. Haptics, the status bar, notifications, the in-app browser and the launch screen all respond from inside the app.

## Your steps

### 1. Install Xcode ✅ done

Xcode and the iOS simulator are installed. Optional: so Terminal tools use the full Xcode too, run this once (it asks for your Mac password):

```bash
sudo xcode-select -s /Applications/Xcode.app
```

### 2. Try the app in the iPhone simulator

With Foundry running on your Mac (double-click `Open Foundry.command`), run these from the `foundry` folder:

```bash
npm run ios:sync
npm run ios:open
```

Xcode opens. At the top, pick an iPhone simulator such as **iPhone 17 Pro**, then press the ▶ Run button. The app opens your local Foundry. Log in with the demo account (`demo@foundry.local` / `foundry-demo`).

Things to try:

- Check off a goal. You should feel a tap on a real phone; the simulator doesn't vibrate.
- Turn on Settings → Daily reminder.
- Open a Launchpad link. It opens in an in-app browser.

Connecting GitHub (to pick repositories in the Launchpad) is done on the Foundry website, not inside the app, because GitHub's sign-in page would finish in Safari instead of the app. Once connected on the web, the repository picker works in the app too. Pasting a repository link works everywhere.

### 3. Join the Apple Developer Program ($99 a year)

Enroll at https://developer.apple.com/programs/enroll/ with your Apple Account. Approval usually takes a day or two.

### 4. Point the app at the live site

Foundry is live at https://foundry-founders.vercel.app, and the iPhone project already points there. If the address ever changes, run:

```bash
FOUNDRY_APP_URL=https://foundry-founders.vercel.app npm run ios:sync
npm run ios:open
```

In Xcode, select the **App** target → **Signing & Capabilities**:

- tick **Automatically manage signing**
- choose your **Team** (it appears once your developer membership is active)
- check that the bundle identifier is `com.mikaelaarey.foundry`

### 5. Create the app in App Store Connect

At https://appstoreconnect.apple.com → **Apps** → **+** → **New App**:

- Platform: iOS
- Name: **Foundry: Idea Notebook**
- Bundle ID: `com.mikaelaarey.foundry`
- SKU: `foundry-ios-1`

Fill in the listing from `docs/app-store/LISTING.md`.

### 6. Upload a build

1. In Xcode, set the device at the top to **Any iOS Device (arm64)**.
2. Choose **Product → Archive**.
3. When the Organizer window opens, click **Distribute App → App Store Connect → Upload**.

The build appears in App Store Connect after about 15 minutes.

### 7. Test with TestFlight

In App Store Connect → **TestFlight**, add yourself and a few friends as testers. Install the **TestFlight** app on your iPhone to get Foundry. Use it for a few days.

### 8. Submit for review

On the app's version page, attach the build, upload the screenshots, fill in the App Review information (demo account and notes from `LISTING.md`), then click **Add for Review → Submit**. Reviews usually take 1 to 2 days. If Apple asks for changes, they explain what in Resolution Center.

## When you change things later

- **Website changes** (pages, features, text) reach the app automatically after you deploy. No App Store update needed.
- **Native changes** (icon, launch screen, plugins, `capacitor.config.ts`): run `FOUNDRY_APP_URL=https://your-domain npm run ios:sync`, raise the version number in Xcode (App target → General → Version), archive, and submit an update.

## Not included yet (good next steps)

- **Push notifications** for replies (needs an Apple push key from your developer account)
- **Share to Foundry** from other apps through the iPhone share sheet
- **Sign in with Apple**, which is needed only if you want GitHub sign-in inside the app
- **Password reset by email**, which needs an email service such as Resend or Postmark
