# App Store listing for Foundry

Everything to paste into App Store Connect, in the order the forms ask for it. Character limits are Apple's.

## App information

| Field | Value |
| --- | --- |
| Name (30) | **Foundry: Idea Notebook** (Apple may reject plain "Foundry" if the name is taken. Alternatives: "Foundry for Founders", "Foundry: Startup Planner") |
| Subtitle (30) | Turn ideas into businesses |
| Bundle ID | `com.mikaelaarey.foundry` (set in `capacitor.config.ts`; can't change after the first upload) |
| SKU | `foundry-ios-1` |
| Primary category | Productivity |
| Secondary category | Business |
| Content rights | Doesn't contain third-party content you don't have rights to |
| Price | Free |
| Copyright | © 2026 Mikaela Arey |

## URLs

Replace `YOUR-DOMAIN` with the address from the deploy guide.

| Field | Value |
| --- | --- |
| Support URL | `https://YOUR-DOMAIN/support` |
| Marketing URL (optional) | `https://YOUR-DOMAIN` |
| Privacy Policy URL | `https://YOUR-DOMAIN/privacy` |

## Promotional text (170)

> Capture ideas the moment they hit, check them against a real validation framework, and run every project with a progress bar for each part of the business.

## Description (4,000)

> Foundry is a think tank for entrepreneurs: a place to catch ideas, decide which ones are worth building, and actually make progress on them.
>
> CAPTURE IDEAS
> • A notebook built for half-baked ideas: jot it down in seconds
> • Color-code, tag and pin ideas, and rate how excited you are about each one
> • Search everything, and turn any idea into a project with one tap
>
> TURN IDEAS INTO PROJECTS
> • Unlimited projects, each split into sections like Coding, Marketing, Product, Finance, Design, Operations, Sales and Legal
> • Every section has its own small goals and its own progress bar
> • Overall progress counts every section equally, so you can see which part of the business needs attention
> • Move projects through stages: Spark, Validate, Build, Launch, Grow
> • Park projects you're pausing without losing them
>
> ONE-TAP LAUNCHPAD
> • Link each project to where the work lives: GitHub, VS Code, Claude, ChatGPT, Gemini, Figma, Notion and more
>
> VALIDATE BEFORE YOU BUILD
> • Browse the Idea Database: business ideas with full reports scoring opportunity, problem, feasibility and timing
> • See the offer ladder, the risks, and the cheapest tests to run first
> • Start a project straight from a report, with sections and goals already filled in
>
> STAY ON TRACK
> • "Next up" shows the next small goal in every project
> • Track your momentum and your daily streak
> • Optional daily reminder to make one step of progress
>
> A ROOM FULL OF FOUNDERS
> • Ask questions, share ideas, post wins and get feedback from other entrepreneurs
> • Upvote helpful posts and reply to anyone
> • Report or block anyone in one tap. Every report is reviewed within 24 hours
>
> Foundry is free. Your projects and notebook are private to you. No ads, and we never sell your data.

## Keywords (100)

```
startup,entrepreneur,business ideas,idea notebook,goals,planner,side hustle,founder,progress,tracker
```

## What's New (first release)

> The first version of Foundry for iPhone.

## Age rating questionnaire

| Question | Answer |
| --- | --- |
| Violence, sexual content, profanity, horror, drugs, gambling, contests | None |
| Medical or treatment information | None |
| Unrestricted web access | **No.** The app only opens Foundry; outside links open in an in-app browser on request. |
| User-generated content | **Yes** (community posts and replies). Apple asks you to confirm you have reporting, blocking and moderation, which Foundry has. |
| Messaging and chat | No |
| Expected result | 12+ |

## App Privacy ("nutrition label")

Data collection: **Yes, we collect data.** None of it is used for tracking.

| Data type | Collected | Linked to the user | Used for tracking | Purpose |
| --- | --- | --- | --- | --- |
| Contact info: Name | Yes | Yes | No | App functionality |
| Contact info: Email address | Yes | Yes | No | App functionality, customer support |
| User content: Other user content (projects, ideas, posts) | Yes | Yes | No | App functionality |
| Identifiers: User ID | Yes | Yes | No | App functionality |

Everything else (location, contacts, health, financial info, browsing history, usage data, diagnostics, purchases): **Not collected.**

## App Review information

| Field | Value |
| --- | --- |
| Sign-in required | Yes |
| Demo account | Create a real account on the live site for Apple, for example `appreview@YOUR-DOMAIN`, and add a sample project and idea. Don't use the local demo account; it only exists on your Mac. |
| Contact | Your name, phone and email |

**Notes for the reviewer** (paste as is, after filling in the demo account):

> Foundry is a workspace for entrepreneurs. Sign in with the demo account above.
>
> Native features: haptic feedback when checking off goals, a daily reminder notification (Settings → Daily reminder), outside links open in an in-app browser, and an offline screen when there's no connection.
>
> User-generated content (Community tab): users must agree to the Terms of Use, which have zero tolerance for objectionable content, when they sign up. A word filter blocks abusive language before it's posted. Every post and reply has a ⋯ menu to Report it or Block its author. Content reported by three people is hidden automatically. Moderators review all reports within 24 hours on a moderation page and can remove content and ban accounts.
>
> Account deletion: Settings → Delete account permanently deletes the account and all of its data.

## Screenshots

Upload the six files in `docs/app-store/screenshots/` (1320 × 2868, iPhone 6.9" display) in this order:

1. `1-home.png`: dashboard with projects, progress rings and streak
2. `2-project.png`: a project with stage, overall progress and the Launchpad
3. `3-notebook.png`: the notebook with a validated idea
4. `4-sections.png`: color-coded sections with goals and progress bars
5. `5-idea-report.png`: an Idea Database report with scores
6. `6-community.png`: the community feed

Refresh them any time with `npm run screenshots:app-store` while Foundry runs locally with demo data.
