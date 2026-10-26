// Local development seed: a demo account plus sample community members.
// Run with `npm run setup` (or `npm run db:seed`). Safe to re-run: it only
// replaces the accounts it created. Don't run this against production.
import crypto from "node:crypto";
import { promisify } from "node:util";
import prismaPkg from "@prisma/client";
import { IDEAS } from "../src/lib/idea-db.ts";

const { PrismaClient } = prismaPkg;
const db = new PrismaClient();
const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

async function hash(pw: string) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

const DAY = 864e5;
const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * 36e5);

const DEMO = { email: "demo@foundry.local", password: "foundry-demo", name: "Jordan Avery", handle: "jordan", bio: "Building Foundry. Coffee subscription on the side." };
const MEMBERS = [
  { email: "priya@sample.foundry.local", name: "Priya Nair", handle: "priya", bio: "Two-time founder. Now building a scheduling tool for clinics." },
  { email: "marcus@sample.foundry.local", name: "Marcus Bell", handle: "marcus", bio: "Designer turned solo SaaS builder." },
  { email: "lena@sample.foundry.local", name: "Lena Hoffmann", handle: "lena", bio: "Student founder. Learning in public." },
  { email: "diego@sample.foundry.local", name: "Diego Ramos", handle: "diego", bio: "Runs a small landscaping company and tinkers with software." },
  { email: "aisha@sample.foundry.local", name: "Aisha Okafor", handle: "aisha", bio: "Marketer helping early-stage teams find their first customers." },
];

type G = [text: string, doneDaysAgo?: number];
const goals = (list: G[]) => list.map(([text, d], i) => ({ text, position: i, done: d !== undefined, doneAt: d !== undefined ? ago(d, 2 + (i % 5)) : null }));

async function main() {
  await db.user.deleteMany({ where: { email: { in: [DEMO.email, ...MEMBERS.map((m) => m.email)] } } });

  const { password: demoPassword, ...demoData } = DEMO;
  const demo = await db.user.create({ data: { ...demoData, passwordHash: await hash(demoPassword) } });
  const members = [];
  for (const m of MEMBERS) members.push(await db.user.create({ data: { ...m, passwordHash: await hash(crypto.randomBytes(12).toString("hex")) } }));
  const [priya, marcus, lena, diego, aisha] = members;

  // ------------------------------------------------------------ projects
  const foundry = await db.project.create({
    data: {
      userId: demo.id,
      name: "Foundry website",
      pitch: "A think tank where entrepreneurs keep unlimited projects, jot ideas and track progress section by section.",
      stage: "build",
      createdAt: ago(20),
      sections: {
        create: [
          { kind: "product", name: "Product", position: 0, goals: { create: goals([["Build a clickable prototype", 9], ["Show the prototype to 5 founders", 4], ["Choose the v1 feature list", 3], ["Decide what stays free", 1], ["Write the launch announcement"]]) } },
          { kind: "coding", name: "Coding", position: 1, goals: { create: goals([["Set up Next.js and the database", 8], ["Add sign-up and login", 6], ["Build projects, sections and goals", 5], ["Add GitHub sign-in", 2], ["Deploy to a custom domain"], ["Move the database to Postgres"]]) } },
          { kind: "design", name: "Design", position: 2, goals: { create: goals([["Pick a visual direction", 7], ["Design the dashboard", 5], ["Design the phone layout"], ["Make the logo"]]) } },
          { kind: "marketing", name: "Marketing", position: 3, goals: { create: goals([["Write the one-sentence pitch", 6], ["Launch a waitlist page"], ["Post in 2 founder communities"], ["Collect 100 waitlist emails"]]) } },
        ],
      },
      links: {
        create: [
          { kind: "claude", label: "Claude", url: "https://claude.ai/", position: 0 },
          { kind: "chatgpt", label: "ChatGPT", url: "https://chatgpt.com/", position: 1 },
          { kind: "gemini", label: "Gemini", url: "https://gemini.google.com/", position: 2 },
        ],
      },
    },
  });

  const coffee = await db.project.create({
    data: {
      userId: demo.id,
      name: "Corner Cup coffee subscription",
      pitch: "Fresh beans from local roasters, delivered every two weeks.",
      stage: "validate",
      createdAt: ago(14),
      sections: {
        create: [
          { kind: "marketing", name: "Marketing", position: 0, goals: { create: goals([["Write a one-sentence pitch", 11], ["Make an Instagram page", 8], ["Launch a waitlist page", 5], ["Collect 50 waitlist emails"], ["Partner with one local cafe"]]) } },
          { kind: "operations", name: "Operations", position: 1, goals: { create: goals([["Find 2 local roasters", 10], ["Price out bags and labels", 3], ["Test one delivery route"], ["Set up a shipping schedule"]]) } },
          { kind: "finance", name: "Finance", position: 2, goals: { create: goals([["Estimate the cost per bag", 2], ["Pick a subscription price"], ["Open a business bank account"], ["Set a 3-month revenue goal"]]) } },
        ],
      },
      links: { create: [{ kind: "custom", label: "Canva", url: "https://www.canva.com/", position: 0 }] },
    },
  });

  await db.project.create({
    data: {
      userId: demo.id,
      name: "ResumeFit AI",
      pitch: "Paste a job post and get a résumé tailored to it in 30 seconds.",
      stage: "build",
      createdAt: ago(18),
      sections: {
        create: [
          { kind: "coding", name: "Coding", position: 0, goals: { create: goals([["Set up the repo and README", 13], ["Build the job-post reader", 7], ["Connect the AI model", 4], ["Build the résumé editor screen", 0], ["Add PDF export"], ["Deploy a live preview"]]) } },
          { kind: "product", name: "Product", position: 1, goals: { create: goals([["Interview 5 job seekers", 12], ["List the 3 core features", 11], ["Sketch the main flow", 6], ["Ship v1 to 10 testers"], ["Write down what v1 will not do"]]) } },
          { kind: "sales", name: "Sales", position: 2, goals: { create: goals([["List 20 career coaches to partner with"], ["Write the outreach message"], ["Book 5 calls"], ["Close the first paying customer"]]) } },
        ],
      },
    },
  });

  await db.project.create({
    data: {
      userId: demo.id,
      name: "Board game café pop-up",
      pitch: "Monthly board game nights in rented cafe space.",
      stage: "spark",
      parked: true,
      createdAt: ago(30),
      sections: {
        create: [
          { kind: "operations", name: "Operations", position: 0, goals: { create: goals([["Ask 3 cafes about evening rentals", 25], ["Buy 10 starter games"]]) } },
          { kind: "marketing", name: "Marketing", position: 1, goals: { create: goals([["Start an event page"], ["Invite 20 friends to the first night"]]) } },
        ],
      },
    },
  });

  // --------------------------------------------------------------- ideas
  const nurses = IDEAS.find((i) => i.slug === "night-shift-meals")!;
  const ideas = [
    { title: "Idea to project in one click", body: "Claude reads a notebook idea and drafts the sections and starter goals. Already works: open an idea and press Make it a project.", tags: "feature", spark: 3, color: "purple", pinned: true, projectId: foundry.id, d: 1 },
    { title: "Weekly founder review", body: "Every Sunday, a short recap: goals finished, what stalled, and what to do next week.", tags: "feature,retention", spark: 3, color: "blue", projectId: foundry.id, d: 2 },
    { title: "Accountability partners", body: "Invite one founder friend to see your progress bars. Each of you gets a nudge when the other goes quiet.", tags: "feature,community", spark: 2, color: "green", projectId: foundry.id, d: 3 },
    { title: "Live GitHub stats on projects", body: "After connecting GitHub, show last commit, open issues and pull requests right on the project page.", tags: "feature,github", spark: 2, color: "none", projectId: foundry.id, d: 4 },
    { title: "Coffee tasting night", body: "Host a monthly tasting at the partner cafe to win subscribers.\nBring a sign-up sheet and a QR code for the waitlist.", tags: "marketing", spark: 2, color: "yellow", projectId: coffee.id, d: 3 },
    { title: nurses.title, body: nurses.tagline, tags: "food,health", spark: 3, color: "yellow", source: "database", report: JSON.stringify(nurses.report), d: 5 },
    { title: "Dog walking for apartment buildings", body: "One walker per building, billed monthly through the front desk.", tags: "local,service", spark: 2, color: "pink", d: 6 },
    { title: "Email thread summarizer", body: "A browser extension that turns a 40-message thread into 5 bullet points.", tags: "ai,software", spark: 1, color: "none", d: 9 },
  ];
  for (const { d, ...i } of ideas) {
    await db.idea.create({ data: { userId: demo.id, ...i, createdAt: ago(d), updatedAt: ago(d) } });
  }

  // ------------------------------------------------------------ community
  const posts = [
    {
      user: priya, kind: "question", d: 1, tags: "sales,early-stage",
      title: "How did you find your first 10 customers?",
      body: "I have a working product for small clinics and 3 friendly users. Cold email gets almost no replies. What actually worked for you to get from 3 to 10?",
      comments: [
        [marcus, "Honestly: I went where they already hang out. For me that was two Slack groups. I answered questions for three weeks before I ever mentioned my product."],
        [aisha, "Ask your 3 users who else they know with the same problem. A warm intro converts far better than a cold email. Make it easy with a two-sentence blurb they can forward."],
        [demo, "Visiting in person worked for my coffee project. Clinics are local too. Could you show up with a one-page flyer?"],
      ],
      voters: [marcus, lena, diego, aisha, demo],
    },
    {
      user: marcus, kind: "win", d: 2, tags: "saas",
      title: "First paying customer for my invoice tool!",
      body: "After 4 months of building nights and weekends, someone I've never met paid $19 for a month. It's tiny, but it's real. Thanks to everyone here who gave feedback on my pricing page.",
      comments: [[lena, "Congrats! Did they find you through search or a post?"], [marcus, "A comment I left in a freelancer forum two months ago. Slow burn!"]],
      voters: [priya, lena, diego, aisha, demo],
    },
    {
      user: lena, kind: "feedback", d: 3, tags: "landing-page,copy",
      title: "Roast my landing page headline",
      body: "I'm building a study planner for university students. Current headline: \"Plan smarter, not harder.\" I feel like it says nothing. What would make you keep reading?",
      comments: [[aisha, "Say the result, not the method. Something like: \"Never pull an all-nighter before an exam again.\" Then show the planner right below it."], [priya, "Agree with Aisha. Also name who it's for in the first line so students feel seen."]],
      voters: [aisha, priya, demo],
    },
    {
      user: diego, kind: "idea", d: 4, tags: "local,marketplace",
      title: "Tool-lending library for apartment buildings",
      body: "Most people need a drill twice a year. What if each building had a smart locker with shared tools, paid through a small monthly fee on rent? Landlords get a perk to advertise. Would you use it?",
      comments: [[marcus, "I'd use it. The hard part is damage and returns. Maybe a deposit per borrow?"]],
      voters: [marcus, lena],
    },
    {
      user: aisha, kind: "question", d: 5, tags: "time-management",
      title: "Solo founders: how do you split your week between building and marketing?",
      body: "I keep telling founders to market earlier, but I know it's hard when the product isn't done. What split works for you? 50/50? Mornings build, afternoons sell?",
      comments: [[priya, "Mondays and Thursdays are sales days, no code allowed. It's the only way I actually do it."], [demo, "I set a goal in each section of my project so marketing doesn't fall to zero. Seeing the bar stuck at 0% is motivating."]],
      voters: [priya, marcus, diego, demo],
    },
    {
      user: demo, kind: "idea", d: 6, tags: "food,health",
      title: "Meal kits for night-shift nurses: would you buy one?",
      body: "Meals planned around a 7pm to 7am shift, delivered to the hospital at shift change. If you work nights (or know someone who does), what would make this a must-have?",
      comments: [[lena, "My sister is a night nurse. She said timing is everything: it has to arrive before 6:30pm or it's useless."]],
      voters: [lena, aisha],
    },
    {
      user: priya, kind: "win", d: 8, tags: "marketing",
      title: "100 waitlist sign-ups from one helpful post",
      body: "I wrote a detailed post about how clinics can cut no-shows, with no pitch until the last line. It brought in 100 waitlist sign-ups over a weekend. Lesson: teach first.",
      comments: [],
      voters: [marcus, diego, aisha],
    },
    {
      user: marcus, kind: "question", d: 10, tags: "payments",
      title: "Which payment provider did you start with, and would you pick it again?",
      body: "About to add paid plans. I care most about easy setup and handling sales tax. What did you choose first and any regrets?",
      comments: [[diego, "Pick the one that handles tax for you if you're solo. Worth the slightly higher fee."]],
      voters: [priya],
    },
  ] as const;

  for (const p of posts) {
    const post = await db.post.create({
      data: { userId: p.user.id, kind: p.kind, title: p.title, body: p.body, tags: p.tags, createdAt: ago(p.d, 3) },
    });
    let h = 0;
    for (const [author, body] of p.comments) {
      h += 3;
      await db.comment.create({ data: { postId: post.id, userId: author.id, body, createdAt: new Date(ago(p.d, 3).getTime() + h * 36e5) } });
    }
    for (const v of p.voters) await db.vote.create({ data: { postId: post.id, userId: v.id } });
  }

  console.log(`Seeded demo account ${DEMO.email} / ${DEMO.password}, ${MEMBERS.length} sample members and ${posts.length} posts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
