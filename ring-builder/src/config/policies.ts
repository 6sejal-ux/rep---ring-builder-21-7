/**
 * CENTRALIZED POLICY CONTENT
 *
 * Edit this file to update trust badges and accordion copy
 * across the entire ring builder — no UI component changes needed.
 */

export interface TrustBadge {
  id: string;
  /** lucide-react icon name */
  icon: "shield-check" | "truck" | "gem" | "refresh-ccw" | "award";
  title: string;
  subtitle: string;
}

export const TRUST_BADGES: TrustBadge[] = [
  {
    id: "guarantee",
    icon: "shield-check",
    title: "30-Day Money-Back Guarantee",
    subtitle: "Products priced up to $15,000 incl. GST",
  },
  {
    id: "shipping",
    icon: "truck",
    title: "Free Insured Shipping",
    subtitle: "Australia & New Zealand",
  },
  {
    id: "diamonds",
    icon: "gem",
    title: "Ethically Sourced Diamonds",
    subtitle: "Conflict-free & certified",
  },
];

export interface PolicyAccordion {
  id: string;
  title: string;
  /** Each string is one bullet. Wrap text in **bold** for emphasis. */
  bullets: string[];
}

export const POLICY_ACCORDIONS: PolicyAccordion[] = [
  {
    id: "shipping",
    title: "Shipping & Returns",
    bullets: [
      "Free insured shipping within **Australia & New Zealand**.",
      "Your order will be delivered within **4–5 weeks** from the date of purchase.",
      "Each ring is shipped in our **signature ring box**.",
      "Tracking details will be shared once your order has been shipped.",
      "Enjoy our **30-day return** policy for complete peace of mind.",
    ],
  },
  {
    id: "resizing",
    title: "Free Resizing",
    bullets: [
      "One complimentary resize within the first **12 months** of purchase.",
      "Simply contact our team and we will arrange everything for you.",
    ],
  },
  {
    id: "warranty",
    title: "Lifetime Warranty",
    bullets: [
      "All Southern Star Diamonds rings include a **lifetime warranty** against manufacturing defects.",
      "Coverage includes prong tightening, structural repairs, and clasp replacement.",
    ],
  },
  {
    id: "certification",
    title: "Diamond Certification",
    bullets: [
      "Every diamond is independently certified by a leading gemological laboratory.",
      "Your certificate confirms cut, colour, clarity, and carat weight.",
    ],
  },
];
