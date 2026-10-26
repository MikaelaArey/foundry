#!/bin/bash
# Double-click this file to start Foundry and open it at http://localhost:3000.
# Keep the Terminal window open while you use Foundry. Close it to stop Foundry.

cd "$(dirname "$0")" || exit 1
URL="http://localhost:3000"

pause() {
  echo
  read -n 1 -s -r -p "Press any key to close this window."
  echo
}
open_browser() {
  [ -z "$FOUNDRY_NO_BROWSER" ] && open "$URL"
}

if ! command -v npm >/dev/null 2>&1; then
  echo "Foundry needs Node.js. Install it from https://nodejs.org, then double-click this file again."
  pause
  exit 1
fi

# Already running? Just open it.
if curl -s -o /dev/null "$URL"; then
  echo "Foundry is already running. Opening $URL"
  open_browser
  exit 0
fi

if [ ! -d node_modules ]; then
  echo "First run: installing Foundry's packages. This takes a minute or two..."
  npm install || { pause; exit 1; }
fi

if [ ! -f .env ]; then
  echo "Creating the settings file (.env)..."
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")
  sed "s/replace-with-a-long-random-string/$SECRET/" .env.example > .env
fi

if [ ! -f prisma/dev.db ]; then
  echo "Creating the database with demo data..."
  npm run setup || { pause; exit 1; }
else
  npx prisma generate >/dev/null 2>&1
fi

echo
echo "Starting Foundry at $URL"
echo "Leave this window open while you use Foundry. Close it, or press Ctrl+C, to stop."
echo
( until curl -s -o /dev/null "$URL"; do sleep 1; done; open_browser ) &
exec npm run dev
