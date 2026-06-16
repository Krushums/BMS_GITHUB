import { OnboardingSlide } from "@/features/help/OnboardingCarousel";

export const parentGuideSlides: OnboardingSlide[] = [
  {
    icon: "heart",
    text: "Build routines, responsibility and independence through positive reinforcement.",
    title: "Turn good behaviour into great rewards."
  },
  {
    examples: [
      { label: "Unload dishwasher", value: "+10" },
      { label: "Homework", value: "+15" },
      { label: "Morning routine", value: "+5" }
    ],
    icon: "flash",
    text: "Create chores, homework goals and responsibilities in seconds. Assign point values and customise them for your household.",
    title: "Set up tasks."
  },
  {
    examples: [
      { label: "Points", value: "120 pts" },
      { label: "Streak", value: "3 days" },
      { label: "Rewards", value: "Gold" },
      { label: "Avatar", value: "Glow" }
    ],
    icon: "sparkles",
    text: "Children earn points, build streaks and unlock rewards through consistency.",
    title: "Kids earn & track."
  },
  {
    examples: [
      { label: "Reward approval", value: "Review" },
      { label: "Homework review", value: "Ready" },
      { label: "Notifications", value: "Clear" }
    ],
    icon: "shield-checkmark",
    text: "Review homework, approve rewards and monitor progress with complete transparency.",
    title: "You stay in control."
  }
];

export const childGuideSlides: OnboardingSlide[] = [
  {
    icon: "sparkles",
    text: "Earn points by completing tasks and homework.",
    title: "Welcome Adventurer"
  },
  {
    icon: "flame",
    text: "Come back every day and keep your streak alive.",
    title: "Build your streak"
  },
  {
    icon: "gift",
    text: "Save points and spend them in the rewards shop.",
    title: "Unlock rewards"
  },
  {
    icon: "trophy",
    text: "Watch your points, level and achievements grow.",
    title: "Track your progress"
  }
];

export const parentWalkthroughCards = [
  {
    icon: "grid",
    title: "Dashboard",
    text: "A calm overview of points, streaks, pending approvals and what needs attention next."
  },
  {
    icon: "checkbox",
    title: "Tasks",
    text: "Create clear responsibilities with points so your child knows exactly what earns progress."
  },
  {
    icon: "pulse",
    title: "Behaviour",
    text: "Add quick bonuses or corrections separately from chores to keep feedback fair and transparent."
  },
  {
    icon: "book",
    title: "Homework",
    text: "Track weekly academic consistency without turning homework into a heavy school system."
  },
  {
    icon: "gift",
    title: "Rewards",
    text: "Create motivating rewards that give points emotional value and make progress feel worth it."
  },
  {
    icon: "camera",
    title: "Review",
    text: "Check proof, approve rewards and keep the system trusted before points are awarded."
  },
  {
    icon: "time",
    title: "History",
    text: "See the points ledger and past activity so decisions feel visible, consistent and fair."
  }
] as const;
