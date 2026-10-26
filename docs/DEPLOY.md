# Putting Foundry online

The iPhone app loads Foundry from the internet, so Foundry needs to be online first. Foundry runs on **Vercel** (the website) with a **Neon** database created from inside Vercel, so there's only one account to make. Both are free to start. It takes about 20 minutes.

## 1. Put the code on GitHub (private)

Vercel deploys from GitHub. Claude can do this step for you. To do it yourself, run this from the `foundry` folder:

```bash
git add -A && git commit -m "Foundry"
gh repo create foundry --private --source . --push
```

Your `.env`, local database and `vercel-settings.env` are never uploaded: `.gitignore` excludes them.

## 2. Create a Vercel account

1. Go to https://vercel.com/signup.
2. Choose **Hobby** (free), enter your name, and click **Continue with GitHub**. Sign in as `MikaelaArey` and allow access.

## 3. Create the database

1. In the Vercel dashboard, open the **Storage** tab and click **Create Database**.
2. Choose **Neon** (Serverless Postgres) and click **Continue**. Accept the terms if asked.
3. Pick the region **Washington, D.C., USA (iad1)**, the **Free** plan, and name it `foundry-db`. Click **Create**. If it offers to connect a project, skip that for now.
4. On the database page, open the **.env.local** tab, click **Show secret**, then **Copy Snippet**. Keep this copied; you'll paste it in the next step.

## 4. Create the website

1. Click **Add New… → Project**.
2. Next to **foundry**, click **Import**. If you don't see it, click **Adjust GitHub App Permissions**, allow access to the `foundry` repository, and come back.
3. On the **Configure Project** screen, leave everything as it is and open **Environment Variables**.
4. Click the first **Key** box and paste the database snippet from step 3. Vercel splits it into separate rows by itself.
5. Open `vercel-settings.env` in the `foundry` folder, copy everything in it, and paste it into the next empty **Key** box. That adds your secret key, support email and moderator email.
6. Click **Deploy**. The first build takes 2 to 3 minutes. It creates the database tables and builds the site.
7. When you see the confetti, click **Continue to Dashboard**. Your site's address is under **Domains**, something like `foundry-xxxx.vercel.app`.

## 5. Check the live site

1. Open your address and **sign up** with `your moderator email`. That email is the moderator, so **Moderation** appears in your sidebar.
2. Open `/support`, `/terms` and `/privacy` and check that `areybusiness23@gmail.com` shows up.
3. Create the App Review demo account described in `docs/app-store/LISTING.md`.

Every time new code is pushed to GitHub, Vercel updates the site by itself. The iPhone app always shows the latest version, with no App Store update needed, unless you change something native (the icon, the plugins, or `capacitor.config.ts`).

## Optional settings

Add these under **Project → Settings → Environment Variables**, then redeploy (**Deployments → ⋯ → Redeploy**):

| Name | What it does |
| --- | --- |
| `APP_URL` | Your site's address. Needed for GitHub sign-in on the website. |
| `ANTHROPIC_API_KEY` | Turns on the AI features: the idea generator, validation reports and goal suggestions. |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub sign-in on the website and the repository picker. Create an OAuth app at https://github.com/settings/developers with the callback URL `https://YOUR-ADDRESS/api/auth/github/callback`. |

Never add `DEV_DEMO_LOGIN`. The demo login is for your Mac only.

## A custom domain (optional)

Buy a domain (from Vercel, Namecheap or Cloudflare) and add it under **Project → Settings → Domains**. Then set `APP_URL` to the new address and redeploy.

## Costs

The free plans cover early use. As Foundry grows, expect about $20 a month for Vercel Pro (needed once Foundry is a commercial product) and about $19 a month for Neon's paid plan. AI features are billed per use by Anthropic, and Foundry limits each person to 20 AI requests an hour.
