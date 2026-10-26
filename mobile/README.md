# iPhone app assets

- `assets/icon.html` → `assets/icon.png` (1024 × 1024): the App Store and home-screen icon
- `assets/splash.html` → `assets/splash.png` (2732 × 2732): the launch screen
- `www/offline.html`: shown inside the app when Foundry can't be reached
- `www/config.js`: written by `npm run ios:sync` with the address the app loads

To change the icon, edit `assets/icon.html`, render it at 1024 × 1024 (for example with headless Chrome), and copy the PNG to
`ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`.
