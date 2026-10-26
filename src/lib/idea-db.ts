import type { Report } from "./schemas";

/**
 * The Idea Database: hand-written ideas with full reports. Scores are
 * Foundry's editorial judgment, not measured market data.
 */
export type CuratedIdea = {
  slug: string;
  title: string;
  tagline: string;
  category: string;
  market: "Niche" | "Medium" | "Large";
  report: Report;
};

export const IDEAS: CuratedIdea[] = [
  {
    slug: "missed-call-rescue",
    title: "Missed-call rescue for plumbers and electricians",
    tagline: "When a tradesperson can't pick up, the caller gets a text in seconds and books the job before calling a competitor.",
    category: "Software",
    market: "Large",
    report: {
      summary:
        "Plumbers, electricians and HVAC techs miss calls all day because they are under a sink or on a roof. Most callers don't leave a voicemail. They call the next company on the list.\n\nThis tool texts every missed caller within seconds: \"Sorry we missed you. What do you need help with?\" It collects the job details and a photo, offers booking times, and sends the owner a clean summary. Charge a monthly fee per business so that one recovered job pays for the whole year.",
      audience: "Owner-operated trade businesses with 1 to 10 technicians",
      badges: ["Clear payback", "Recurring revenue", "Simple to sell"],
      scores: { opportunity: 9, problem: 8, feasibility: 8, whyNow: 7 },
      scoreLabels: { opportunity: "Big market", problem: "Costs real money", feasibility: "Buildable in weeks", whyNow: "Texting is expected" },
      revenue: { level: 2, note: "$49 to $149 a month per business" },
      difficulty: { score: 4, note: "Phone and SMS services do most of the work" },
      goToMarket: { score: 8, note: "Trade groups and suppliers reach owners directly" },
      offers: [
        { stage: "Lead magnet", name: "Missed-call calculator", price: "Free", description: "Owners enter calls per week and average job size to see what missed calls cost them." },
        { stage: "Frontend", name: "30-day pilot", price: "$49", description: "Set up on their existing number, with a report of every job recovered." },
        { stage: "Core", name: "Monthly plan", price: "$99/month", description: "Text-back, booking links, job summaries and a weekly report." },
      ],
      whyNow:
        "Customers now expect to text a business instead of waiting on hold, and phone providers make it easy to forward missed calls to software. Many small trade businesses still run on one cell phone.",
      risks: [
        "Business text messaging requires registration before you can send",
        "Owners are busy and slow to set up new tools",
        "Large field-service platforms could add the same feature",
      ],
      experiments: [
        "Call 20 local plumbers after hours and count how many text back",
        "Offer 5 owners a free pilot and track recovered jobs for 2 weeks",
        "Post the missed-call calculator in two trade owner groups",
      ],
      plan: [
        { kind: "marketing", goals: ["Build the missed-call calculator page", "Join 3 trade owner groups", "Interview 10 trade business owners", "Collect 25 pilot sign-ups"] },
        { kind: "coding", goals: ["Forward a test number to a text-back service", "Send an instant reply to missed callers", "Collect job details and a photo by text", "Email the owner a daily summary"] },
        { kind: "sales", goals: ["List 50 local trade businesses", "Write a 3-line outreach message", "Book 10 demo calls", "Close 5 paying pilots"] },
        { kind: "legal", goals: ["Register for business text messaging", "Write clear opt-out wording", "Draft simple terms of service"] },
      ],
    },
  },
  {
    slug: "night-shift-meals",
    title: "Meal kits for night-shift nurses",
    tagline: "Healthy meals timed for a 7pm to 7am body clock, delivered to the hospital before the shift starts.",
    category: "Food & Health",
    market: "Medium",
    report: {
      summary:
        "Night-shift healthcare workers eat at odd hours, and many hospital cafeterias close in the evening. What's left is vending machines and takeout that arrives cold.\n\nThis service delivers a weekly box planned around a night shift: a real meal before work, a light one at 2am, and something that helps with sleep after. Start with one hospital, deliver at shift change, and sell by subscription.",
      audience: "Nurses, doctors and techs who work 12-hour night shifts",
      badges: ["Underserved", "Word of mouth", "Recurring revenue"],
      scores: { opportunity: 7, problem: 8, feasibility: 6, whyNow: 7 },
      scoreLabels: { opportunity: "Loyal niche", problem: "Daily pain", feasibility: "Food logistics", whyNow: "Night shifts are common" },
      revenue: { level: 2, note: "$80 to $120 a week per subscriber" },
      difficulty: { score: 6, note: "Food safety rules and tight delivery windows" },
      goToMarket: { score: 8, note: "One happy ward tells the next ward" },
      offers: [
        { stage: "Lead magnet", name: "Night Shift Eating Guide", price: "Free", description: "A one-page plan for what to eat before, during and after a night shift." },
        { stage: "Frontend", name: "Trial week box", price: "$49", description: "Five meals and snacks delivered at shift change." },
        { stage: "Core", name: "Weekly subscription", price: "$95/week", description: "Planned meals every week, with dietary options." },
      ],
      whyNow:
        "Hospitals rely on night and overtime shifts, and night workers form large, easy-to-reach communities online. Licensed kitchens and delivery partners can be rented by the hour in most cities.",
      risks: ["Delivering on time around shift change is hard", "Food handling permits vary by city", "Many nurses already meal-prep at home"],
      experiments: ["Post in 3 nursing groups and collect 50 sign-ups", "Hand-deliver 20 trial boxes at one hospital", "Ask a charge nurse to host a free tasting"],
      plan: [
        { kind: "marketing", goals: ["Write the one-sentence pitch", "Post in 3 nursing communities", "Collect 50 waitlist sign-ups", "Get 5 testimonials from trial boxes"] },
        { kind: "operations", goals: ["Find a licensed kitchen to rent", "Plan a 5-meal night-shift menu", "Test one delivery at shift change", "Choose packaging that stays fresh"] },
        { kind: "finance", goals: ["Estimate cost per box", "Set the subscription price", "Open a business bank account"] },
        { kind: "legal", goals: ["Get the local food handler permit", "Check insurance for food delivery"] },
      ],
    },
  },
  {
    slug: "senior-tech-help",
    title: "Tech help membership for older adults",
    tagline: "A friendly person who sets up phones, fixes Wi-Fi and spots scams, on call for a flat monthly fee.",
    category: "Services",
    market: "Large",
    report: {
      summary:
        "Many older adults rely on family for tech help, and family isn't always nearby. A frozen tablet or a scary pop-up can cut someone off from their doctor, bank or grandkids.\n\nThis is a monthly membership: unlimited phone and video help, one home visit a month, and a scam-check line. Adult children often pay for it as a gift. Start in one city with retired IT workers or students as helpers.",
      audience: "Adults over 70 and the adult children who help them",
      badges: ["Gift buyer", "Trust-based", "Low startup cost"],
      scores: { opportunity: 8, problem: 7, feasibility: 9, whyNow: 8 },
      scoreLabels: { opportunity: "Growing group", problem: "Frequent frustration", feasibility: "No code needed", whyNow: "Scams keep rising" },
      revenue: { level: 2, note: "$39 to $79 a month per household" },
      difficulty: { score: 3, note: "Hiring kind, patient helpers is the main job" },
      goToMarket: { score: 6, note: "Reach adult children online and seniors through community centers" },
      offers: [
        { stage: "Lead magnet", name: "Scam warning signs card", price: "Free", description: "A fridge card listing the most common phone and email scams." },
        { stage: "Frontend", name: "Tech tune-up visit", price: "$89", description: "One home visit to set up devices, passwords and video calling." },
        { stage: "Core", name: "Monthly membership", price: "$49/month", description: "Unlimited help calls, one visit a month and a scam-check line." },
      ],
      whyNow:
        "More everyday services now require an app or an online account, and scams aimed at older adults are a constant worry for families. People want someone they can trust.",
      risks: ["Helpers need background checks", "Seniors may be wary of strangers at first", "Members may cancel once devices are set up"],
      experiments: ["Run a free tech help hour at a senior center", "Offer 10 families a first month for $1", "Survey adult children about what they would pay"],
      plan: [
        { kind: "marketing", goals: ["Print the scam warning card", "Host a free tech help hour", "Run a gift offer for adult children", "Get 10 reviews"] },
        { kind: "operations", goals: ["Write a helper checklist for visits", "Set up a help phone line", "Run background checks for helpers", "Create a visit booking calendar"] },
        { kind: "finance", goals: ["Set the membership price", "Estimate helper pay per visit", "Track monthly cancellations"] },
        { kind: "legal", goals: ["Get liability insurance", "Write a simple service agreement"] },
      ],
    },
  },
  {
    slug: "baby-gear-rental",
    title: "Baby gear rental by the month",
    tagline: "Rent the bassinet, swing and stroller for the months you need them, then swap for the next stage.",
    category: "Marketplace",
    market: "Medium",
    report: {
      summary:
        "Babies outgrow gear in weeks. Parents spend a lot on items that sit in a closet after three months, and reselling them takes time.\n\nThis service rents clean, inspected baby gear by the month and swaps it as the child grows. Start with the ten most expensive short-use items, deliver locally, and sell stage bundles like \"the first three months\".",
      audience: "Expecting and new parents in cities with small homes",
      badges: ["Less waste", "Bundle upsells", "Fits gift registries"],
      scores: { opportunity: 7, problem: 7, feasibility: 6, whyNow: 6 },
      scoreLabels: { opportunity: "Steady demand", problem: "Costly and short-lived", feasibility: "Inventory heavy", whyNow: "Resale fatigue" },
      revenue: { level: 2, note: "$60 to $150 a month per family" },
      difficulty: { score: 6, note: "Cleaning, storage and delivery need care" },
      goToMarket: { score: 7, note: "Registries and parenting groups spread it" },
      offers: [
        { stage: "Lead magnet", name: "What you actually need checklist", price: "Free", description: "A stage-by-stage list of baby gear: what to rent and what to buy." },
        { stage: "Frontend", name: "Newborn starter bundle", price: "$89/month", description: "Bassinet, swing and baby carrier for the first months." },
        { stage: "Core", name: "Grow-with-me plan", price: "$129/month", description: "Swap gear at each stage, with free delivery." },
      ],
      whyNow: "Renting instead of owning is familiar from clothing and furniture, and parents are more open to second-hand gear when it's professionally cleaned.",
      risks: ["Safety recalls need careful tracking", "Damage and cleaning costs add up", "Storage space costs money"],
      experiments: ["Rent 10 items to friends and track their condition", "Add a rental option to a baby registry page", "Survey 30 parents about their most regretted purchase"],
      plan: [
        { kind: "product", goals: ["Pick the 10 items to rent", "Write the cleaning and safety check", "Design the stage bundles"] },
        { kind: "marketing", goals: ["Post the checklist in parent groups", "Partner with one prenatal class", "Collect 40 waitlist sign-ups"] },
        { kind: "operations", goals: ["Find storage space", "Set up a delivery schedule", "Track each item's condition"] },
        { kind: "finance", goals: ["Estimate cost per item", "Set bundle prices", "Plan deposit and damage fees"] },
      ],
    },
  },
  {
    slug: "grant-writing-copilot",
    title: "Grant-writing copilot for small nonprofits",
    tagline: "Find grants that fit, then draft applications from the nonprofit's own past reports.",
    category: "AI",
    market: "Medium",
    report: {
      summary:
        "Small nonprofits run on a few staff and many volunteers. Grant applications take days of writing, and most of these organizations can't afford a grant writer.\n\nThis tool stores the nonprofit's mission, programs, budgets and past reports, finds grants that match, and drafts each application in the funder's format. Staff review and edit instead of starting from a blank page.",
      audience: "Nonprofits with budgets under $2 million and no full-time grant writer",
      badges: ["AI native", "Mission-driven buyers", "Sticky"],
      scores: { opportunity: 8, problem: 9, feasibility: 7, whyNow: 8 },
      scoreLabels: { opportunity: "Thousands of small orgs", problem: "Days per application", feasibility: "AI makes it possible", whyNow: "Funding is competitive" },
      revenue: { level: 2, note: "$99 to $299 a month per organization" },
      difficulty: { score: 5, note: "Grant sources and formats vary a lot" },
      goToMarket: { score: 6, note: "Nonprofit networks and state associations" },
      offers: [
        { stage: "Lead magnet", name: "Grant readiness checklist", price: "Free", description: "What to gather before applying for any grant." },
        { stage: "Frontend", name: "One application draft", price: "$149", description: "A full first draft for one grant, written from their own documents." },
        { stage: "Core", name: "Monthly plan", price: "$199/month", description: "Grant matching, unlimited drafts and deadline reminders." },
      ],
      whyNow:
        "AI can now write solid first drafts from an organization's own material, and small nonprofits often compete for the same limited pool of funding.",
      risks: ["Some funders may push back on AI-assisted applications", "Every grant has a different format", "Nonprofits have tight budgets"],
      experiments: ["Draft one real application for a local nonprofit for free", "Interview 10 executive directors about their grant process", "Offer a paid draft to 5 organizations"],
      plan: [
        { kind: "product", goals: ["Interview 10 nonprofit directors", "Map the common grant sections", "Design the document upload flow"] },
        { kind: "coding", goals: ["Build document upload and storage", "Draft an application from uploaded files", "Add funder deadline reminders"] },
        { kind: "marketing", goals: ["Publish the readiness checklist", "Speak at one nonprofit meetup", "Collect 30 sign-ups"] },
        { kind: "sales", goals: ["List 50 local nonprofits", "Write the outreach email", "Close 5 paying pilots"] },
      ],
    },
  },
  {
    slug: "rec-league-manager",
    title: "Adult rec league manager",
    tagline: "Schedules, payments, subs and standings for adult sports leagues, without the spreadsheet.",
    category: "Software",
    market: "Medium",
    report: {
      summary:
        "Adult kickball, volleyball and softball leagues are often run by one volunteer with a spreadsheet and a group chat. Collecting fees, finding subs and rescheduling rainouts eats their evenings.\n\nThis app handles sign-ups, payments, schedules and standings, and finds subs from a waitlist with one tap. Organizers start free; players pay a small fee at sign-up, or organizers pay monthly for extras.",
      audience: "Volunteer organizers of adult recreational sports leagues",
      badges: ["Network effects", "Spreads by itself", "Seasonal"],
      scores: { opportunity: 7, problem: 7, feasibility: 8, whyNow: 6 },
      scoreLabels: { opportunity: "Many small leagues", problem: "Admin headaches", feasibility: "Standard features", whyNow: "Social sports are popular" },
      revenue: { level: 1, note: "$2 per player per season, or $29 a month per league" },
      difficulty: { score: 4, note: "Scheduling logic is the hardest part" },
      goToMarket: { score: 8, note: "Every league brings in dozens of players" },
      offers: [
        { stage: "Lead magnet", name: "Free schedule maker", price: "Free", description: "Make a fair round-robin schedule for any number of teams." },
        { stage: "Frontend", name: "Organizer starter", price: "Free", description: "Sign-ups and schedules for one league." },
        { stage: "Core", name: "League pro", price: "$29/month", description: "Payments, sub finder, standings and messaging." },
      ],
      whyNow: "Social sports leagues have become a popular way for adults to meet people, and organizers expect the polish of consumer apps.",
      risks: ["Seasonal usage makes revenue lumpy", "Free spreadsheets are good enough for some", "Big sports platforms serve larger leagues"],
      experiments: ["Share a free schedule maker in organizer forums", "Run one local league on the app for a season", "Ask 10 organizers what takes the most time"],
      plan: [
        { kind: "coding", goals: ["Build the schedule maker", "Add team sign-up and payments", "Add a sub waitlist", "Show live standings"] },
        { kind: "marketing", goals: ["Share the schedule maker in 3 forums", "Sponsor one local league", "Collect 20 organizer sign-ups"] },
        { kind: "product", goals: ["Interview 10 league organizers", "Pick the 3 features for season one"] },
      ],
    },
  },
  {
    slug: "turnover-proof",
    title: "Photo-proof cleaning checklists for vacation rentals",
    tagline: "Cleaners complete a room-by-room checklist with photos, so hosts know the place is ready before guests arrive.",
    category: "Software",
    market: "Medium",
    report: {
      summary:
        "Vacation rental hosts often manage properties from far away. They rely on cleaners they rarely see, and only find out something was missed when a guest leaves a bad review.\n\nThis app gives cleaners a room-by-room checklist that requires photos, flags low supplies, and reports damage right away. Hosts get a ready-for-guests report on their phone. Charge per property per month.",
      audience: "Hosts with 2 to 50 vacation rentals and their cleaning teams",
      badges: ["Clear pain", "Per-property pricing", "Daily habit"],
      scores: { opportunity: 7, problem: 8, feasibility: 8, whyNow: 6 },
      scoreLabels: { opportunity: "Fragmented market", problem: "Bad reviews cost money", feasibility: "Simple mobile app", whyNow: "Guests expect hotel standards" },
      revenue: { level: 2, note: "$8 to $15 per property per month" },
      difficulty: { score: 4, note: "Mostly a checklist app with photo upload" },
      goToMarket: { score: 6, note: "Host communities are active and easy to find" },
      offers: [
        { stage: "Lead magnet", name: "Turnover checklist template", price: "Free", description: "A printable room-by-room cleaning checklist for rentals." },
        { stage: "Frontend", name: "Starter", price: "$9/property", description: "Photo checklists and ready-for-guests reports." },
        { stage: "Core", name: "Pro", price: "$14/property", description: "Supply tracking, damage reports and cleaner scheduling." },
      ],
      whyNow: "Guests compare rentals with hotels and leave detailed reviews, and more hosts run several properties remotely.",
      risks: ["Cleaners may resist extra steps", "Property management suites include similar features", "Local short-term rental rules keep changing"],
      experiments: ["Give the free template to 30 hosts and ask for feedback", "Pilot the app with 3 cleaners for 2 weeks", "Read 20 listings' reviews and count cleanliness complaints"],
      plan: [
        { kind: "coding", goals: ["Build the room checklist with required photos", "Send hosts a ready-for-guests report", "Add a low-supplies flag"] },
        { kind: "marketing", goals: ["Publish the checklist template", "Post in 3 host communities", "Collect 25 host sign-ups"] },
        { kind: "sales", goals: ["Contact 20 cleaning companies", "Offer 5 free pilots"] },
      ],
    },
  },
  {
    slug: "freelancer-tax-set-aside",
    title: "Automatic tax set-aside for freelancers",
    tagline: "Every time a client pays, the right amount moves into a tax savings account, so tax season is never a surprise.",
    category: "Fintech",
    market: "Large",
    report: {
      summary:
        "Freelancers and creators get paid without taxes taken out. Many spend the money and then face a large bill they can't cover.\n\nThis app connects to the account where payments land, estimates the tax owed on each payment, and moves that amount into a separate savings account automatically. It reminds people about quarterly payments and shows how much is safe to spend.",
      audience: "Freelancers, contractors and creators paid without tax withholding",
      badges: ["Huge audience", "Emotional pain", "Regulated"],
      scores: { opportunity: 8, problem: 9, feasibility: 5, whyNow: 7 },
      scoreLabels: { opportunity: "Millions of freelancers", problem: "Stressful surprise bills", feasibility: "Banking rules add work", whyNow: "Freelancing keeps growing" },
      revenue: { level: 2, note: "$5 to $12 a month per user" },
      difficulty: { score: 8, note: "Bank connections, security and compliance" },
      goToMarket: { score: 7, note: "Creator and freelancer communities share tools quickly" },
      offers: [
        { stage: "Lead magnet", name: "Quarterly tax calculator", price: "Free", description: "Estimate what to set aside from each payment." },
        { stage: "Frontend", name: "Tax reminders", price: "$3/month", description: "Quarterly deadline reminders and set-aside estimates." },
        { stage: "Core", name: "Auto set-aside", price: "$9/month", description: "Automatic transfers, a safe-to-spend balance and a year-end summary." },
      ],
      whyNow: "More people earn money from freelance work and creator platforms, and bank-connection services make automatic transfers possible for small teams.",
      risks: ["Handling money means strict security and compliance", "Tax rules differ by country and state", "Banks and accounting apps could copy it"],
      experiments: ["Launch the calculator and measure sign-ups", "Set aside taxes by hand for 10 freelancers for one quarter", "Interview 15 freelancers about their last tax bill"],
      plan: [
        { kind: "product", goals: ["Interview 15 freelancers", "Decide which countries to support first", "Design the safe-to-spend screen"] },
        { kind: "coding", goals: ["Build the set-aside calculator", "Connect a test bank account", "Schedule automatic transfers"] },
        { kind: "legal", goals: ["Talk to a fintech lawyer", "Choose a banking partner", "Write the privacy policy"] },
        { kind: "marketing", goals: ["Share the calculator with creator newsletters", "Collect 100 waitlist emails"] },
      ],
    },
  },
  {
    slug: "menu-translator",
    title: "Instant multilingual menus for tourist-town restaurants",
    tagline: "Restaurants upload a photo of their menu and get a QR code that shows it in each diner's own language.",
    category: "Hospitality",
    market: "Medium",
    report: {
      summary:
        "Restaurants in tourist areas lose orders when visitors can't read the menu. Staff spend time translating at the table, and printed translations go out of date with every price change.\n\nThis tool turns a photo of the menu into a mobile menu that switches language automatically, with allergen notes and dish photos. Updates are instant. Charge restaurants monthly and sell through local tourism boards.",
      audience: "Independent restaurants and cafes in areas with many international visitors",
      badges: ["Quick setup", "Visible results", "AI native"],
      scores: { opportunity: 7, problem: 7, feasibility: 8, whyNow: 7 },
      scoreLabels: { opportunity: "Every tourist town", problem: "Lost orders", feasibility: "Translation AI is strong", whyNow: "QR menus are normal" },
      revenue: { level: 1, note: "$19 to $49 a month per restaurant" },
      difficulty: { score: 3, note: "Menu photo to web page is well understood" },
      goToMarket: { score: 7, note: "Tourism boards and restaurant groups can refer many at once" },
      offers: [
        { stage: "Lead magnet", name: "Free menu translation", price: "Free", description: "Translate one menu into three languages as a preview." },
        { stage: "Frontend", name: "Basic", price: "$19/month", description: "A multilingual QR menu with instant updates." },
        { stage: "Core", name: "Plus", price: "$39/month", description: "Allergen tags, dish photos and visitor stats." },
      ],
      whyNow: "Diners are used to QR menus, and machine translation now handles food terms well enough for everyday use.",
      risks: ["A mistranslated allergen is a serious risk", "Restaurants have thin margins", "Menu platforms may add translation"],
      experiments: ["Translate 10 local menus for free and watch usage", "Ask a tourism office to share it with members", "Track which languages visitors choose most"],
      plan: [
        { kind: "coding", goals: ["Turn a menu photo into text", "Show the menu in the visitor's language", "Generate a QR code per restaurant"] },
        { kind: "sales", goals: ["List 30 restaurants in one tourist area", "Visit 10 in person with a demo", "Close 5 paying restaurants"] },
        { kind: "marketing", goals: ["Pitch the local tourism board", "Collect 3 restaurant testimonials"] },
      ],
    },
  },
];

export const CATEGORIES = Array.from(new Set(IDEAS.map((i) => i.category)));
export const findIdea = (slug: string) => IDEAS.find((i) => i.slug === slug) ?? null;

/** Rotates through the database, one idea per UTC day. */
export function ideaOfTheDay(date = new Date()) {
  const day = Math.floor(date.getTime() / 864e5);
  return IDEAS[day % IDEAS.length];
}

export const overallScore = (r: Report) =>
  Math.round(((r.scores.opportunity + r.scores.problem + r.scores.feasibility + r.scores.whyNow) / 40) * 100);

/** Offline stand-in for the AI generator: ranks database ideas by keyword overlap. */
export function matchIdeas(query: string, limit = 5) {
  const words = query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const scored = IDEAS.map((idea, i) => {
    const hay = `${idea.title} ${idea.tagline} ${idea.category} ${idea.report.audience} ${idea.report.summary}`.toLowerCase();
    const hits = words.reduce((a, w) => a + (hay.includes(w) ? 1 : 0), 0);
    return { idea, rank: hits * 100 + overallScore(idea.report) + ((i * 7) % 5) };
  });
  return scored.sort((a, b) => b.rank - a.rank).slice(0, limit).map((x) => x.idea);
}
