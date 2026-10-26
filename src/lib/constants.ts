export const KIND_KEYS = [
  "coding",
  "marketing",
  "product",
  "finance",
  "design",
  "operations",
  "sales",
  "legal",
  "custom",
] as const;
export type Kind = (typeof KIND_KEYS)[number];

export const KINDS: Record<Kind, { label: string; blurb: string; starters: string[] }> = {
  coding: {
    label: "Coding",
    blurb: "Build the thing",
    starters: ["Set up the repo and README", "Pick the tech stack", "Build the first working screen", "Add sign-up and login", "Deploy a live preview link"],
  },
  marketing: {
    label: "Marketing",
    blurb: "Get noticed",
    starters: ["Write a one-sentence pitch", "Describe the ideal customer", "Launch a waitlist page", "Share the idea in 3 communities", "Collect 50 waitlist emails"],
  },
  product: {
    label: "Product",
    blurb: "Decide what to build",
    starters: ["List the 3 core features for v1", "Sketch the main user flow", "Interview 5 potential users", "Write down what v1 will not do", "Ship v1 to 10 testers"],
  },
  finance: {
    label: "Finance",
    blurb: "Money in and out",
    starters: ["Estimate monthly costs", "Pick a pricing model", "Set a first-year revenue target", "Open a business bank account", "Track every expense in one sheet"],
  },
  design: {
    label: "Design",
    blurb: "Look and feel",
    starters: ["Pick a name and check the domain", "Choose colors and fonts", "Design the logo", "Mock up the home screen", "Make a one-page brand guide"],
  },
  operations: {
    label: "Operations",
    blurb: "Run it smoothly",
    starters: ["Choose the tools you will use", "Write a weekly routine", "Document how orders get fulfilled", "Set up a shared calendar", "Automate one repetitive task"],
  },
  sales: {
    label: "Sales",
    blurb: "Close customers",
    starters: ["List 20 dream customers", "Write a short outreach message", "Book 5 discovery calls", "Close the first paying customer", "Ask the first customer for a referral"],
  },
  legal: {
    label: "Legal",
    blurb: "Protect the business",
    starters: ["Choose a business structure", "Register the business name", "Draft terms of service", "Draft a privacy policy", "Check for trademark conflicts"],
  },
  custom: { label: "Custom", blurb: "Anything else", starters: [] },
};
export const KIND_ORDER: Kind[] = ["coding", "marketing", "product", "finance", "design", "operations", "sales", "legal"];

export const STAGES = [
  { key: "spark", label: "Spark", hint: "Just an idea" },
  { key: "validate", label: "Validate", hint: "Do people want it?" },
  { key: "build", label: "Build", hint: "Making version one" },
  { key: "launch", label: "Launch", hint: "In front of customers" },
  { key: "grow", label: "Grow", hint: "Finding more of them" },
] as const;
export type StageKey = (typeof STAGES)[number]["key"];
export const stageOf = (key: string) => STAGES.find((s) => s.key === key) ?? STAGES[0];

export const TOOL_KEYS = ["github", "vscode", "claude", "chatgpt", "gemini"] as const;
export type ToolKey = (typeof TOOL_KEYS)[number];
export const TOOLS: Record<ToolKey, { name: string; icon: string; placeholder: string; tip: string }> = {
  github: {
    name: "GitHub",
    icon: "branch",
    placeholder: "https://github.com/you/your-repo",
    tip: "Pick a repository or paste its link. You also get quick links to issues, pull requests and github.dev.",
  },
  vscode: {
    name: "VS Code",
    icon: "code",
    placeholder: "https://vscode.dev/github/you/your-repo",
    tip: "A vscode.dev link opens the repo in VS Code in your browser. A vscode://file/… link opens a folder in the desktop app.",
  },
  claude: {
    name: "Claude",
    icon: "spark",
    placeholder: "https://claude.ai/project/…",
    tip: "Link the Claude project or chat where you work on this.",
  },
  chatgpt: {
    name: "ChatGPT",
    icon: "chat",
    placeholder: "https://chatgpt.com/g/…",
    tip: "Link the ChatGPT project, GPT or chat you use for this.",
  },
  gemini: {
    name: "Gemini",
    icon: "star",
    placeholder: "https://gemini.google.com/gem/…",
    tip: "Link the Gemini Gem or chat you use for this.",
  },
};

export const POST_KINDS = {
  question: { label: "Question", plural: "Questions", chip: "chip-info", icon: "help" },
  idea: { label: "Idea", plural: "Ideas", chip: "chip-brand", icon: "bulb" },
  win: { label: "Win", plural: "Wins", chip: "chip-good", icon: "trophy" },
  feedback: { label: "Feedback", plural: "Feedback requests", chip: "chip-warm", icon: "message" },
} as const;
export type PostKind = keyof typeof POST_KINDS;
export const POST_KIND_KEYS = Object.keys(POST_KINDS) as PostKind[];

export const NOTE_COLORS = ["none", "yellow", "green", "blue", "pink", "purple"] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];
export const SPARK_LABELS: Record<number, string> = { 1: "Maybe", 2: "Promising", 3: "Hot" };

export const REPORT_REASONS = {
  spam: "Spam or scam",
  harassment: "Harassment or hate",
  sexual: "Sexual content",
  violence: "Violence or threats",
  other: "Something else",
} as const;
export type ReportReason = keyof typeof REPORT_REASONS;
export const REPORT_REASON_KEYS = Object.keys(REPORT_REASONS) as ReportReason[];
