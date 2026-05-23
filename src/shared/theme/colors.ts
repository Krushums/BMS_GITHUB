export const colors = {
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceMuted: "#EEF4F7",
  ink: "#14213D",
  inkMuted: "#64748B",
  border: "#DDE7EE",
  primary: "#2AB7A9",
  primaryDark: "#158A80",
  accent: "#FFB84D",
  success: "#35C46A",
  danger: "#EF5B5B",
  violet: "#7C6FF6",
  sky: "#48A8F5"
} as const;

export type AppColor = keyof typeof colors;
