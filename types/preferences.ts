export type Gender = "male" | "female";
export type Platform = "Instagram" | "TikTok" | "Facebook" | "YouTube" | "Other";
export type BlurStyle = "glass" | "mist" | "pattern" | "pastel";
export type DetectionMode = "strict" | "balanced" | "relaxed";
export type DashboardTheme = "pastel" | "light" | "dark" | "emerald" | "blue" | "purple" | "custom";
export type UiFont = "system" | "inter" | "outfit" | "roboto";
export type ArabicFont = "amiri" | "tajawal";

export interface TrustedHandle {
  id: string;
  handle: string;
  platform: Platform;
  relation: string;
}

export interface Preferences {
  gender: Gender;
  enabled: boolean;
  blurStyle: BlurStyle;
  detectionMode: DetectionMode;
  focusMode: boolean;
  theme: DashboardTheme;
  accent: string;
  uiFont: UiFont;
  arabicFont: ArabicFont;
  blurStrength: number;
  domains: string[];
  handles: TrustedHandle[];
  filteredCount: number;
  focusMinutes: number;
}