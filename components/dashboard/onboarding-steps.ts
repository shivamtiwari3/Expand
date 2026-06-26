export type RailTab = "insights" | "rfps" | "community" | "ask" | "advisor";

export interface OnboardingStep {
  id: string;
  title: string;
  body: string;
  /** CSS selector for spotlight target; omit for centered modal steps */
  target?: string;
  /** Switch right-rail tab when this step is active */
  tab?: RailTab;
  /** Highlight a district on the map for narrative demos */
  district?: string;
}

export const ONBOARDING_KEY = "xpand_onboarding_v1";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Xpand",
    body: "Decision intelligence for the UAE — see what every area is missing, where demand is heading, and who can build there. This 60-second tour walks the demo judges expect.",
  },
  {
    id: "map",
    title: "Gap map · 7 emirates",
    target: '[data-tour="map"]',
    body: "Districts colour by service-gap severity. Diamond pins mark Xpand’s recommended build sites. Pan and zoom across Abu Dhabi through Ras Al Khaimah.",
  },
  {
    id: "sidebar",
    title: "District explorer",
    target: '[data-tour="sidebar"]',
    body: "Ranked by urgency — pick any district. Toggle amenity categories (schools, clinics, transit, retail…) to filter what the map emphasises.",
    district: "Al Reem Island",
  },
  {
    id: "district",
    title: "Xpand recommends",
    target: '[data-tour="district-panel"]',
    tab: "insights",
    body: "Select a district and AI loads instantly — grounded on computed gaps, forecast, investors and live listings. K2 Think when configured; fast engine offline by default.",
  },
  {
    id: "rfps",
    title: "Gaps → proposals",
    target: '[data-tour="rfps"]',
    tab: "rfps",
    body: "The widest gaps become open RFPs: the need, vacant land, and investors already interested. A gap becomes something you can act on.",
  },
  {
    id: "community",
    title: "Community connect",
    target: '[data-tour="community"]',
    tab: "community",
    body: "Operators and ventures matched to district gaps — who could fill the need on the ground.",
  },
  {
    id: "ask",
    title: "Ask K2",
    target: '[data-tour="ask-k2"]',
    tab: "ask",
    body: "Plain-language Q&A across the whole UAE dataset. Try: “Which areas are most underserved for schools?”",
  },
  {
    id: "advisor",
    title: "Advisor wizard",
    target: '[data-tour="advisor"]',
    tab: "advisor",
    body: "Anonymous tailored insights — role, emirate, sectors, budget — no sign-in, nothing stored. Built for investors, planners and operators.",
  },
  {
    id: "done",
    title: "You’re demo-ready",
    body: "Replay anytime from the header. For the 3-minute pitch: pick a critical district → read the AI recommendation → open an RFP → ask K2 one follow-up.",
  },
];
