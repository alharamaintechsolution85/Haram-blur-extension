import type { Preferences } from "@/types/preferences";

export const storageKey = "haram-blur.preferences.v1";

export const defaults: Preferences = {
  gender: "male",
  enabled: true,
  blurStyle: "glass",
  detectionMode: "balanced",
  focusMode: false,
  theme: "pastel",
  accent: "#2e7d32",
  uiFont: "system",
  arabicFont: "amiri",
  blurStrength: 25,
  domains: [],
  handles: [],
  filteredCount: 0,
  focusMinutes: 0,
};

export function readPreferences(): Preferences {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return defaults;

    const value = JSON.parse(saved) as Partial<Preferences>;
    const legacyTheme = value.theme as string | undefined;
    const savedTheme = legacyTheme === "warm" ? "pastel" : legacyTheme === "slate" ? "dark" : legacyTheme;
    const themes = ["pastel", "light", "dark", "emerald", "blue", "purple", "custom"];
    const theme = typeof savedTheme === "string" && themes.includes(savedTheme) ? savedTheme as Preferences["theme"] : defaults.theme;
    const blur = Number(value.blurStrength);
    return {
      ...defaults,
      ...value,
      theme,
      accent: typeof value.accent === "string" && /^#[\da-f]{6}$/i.test(value.accent) ? value.accent : defaults.accent,
      uiFont: ["system", "inter", "outfit", "roboto"].includes(String(value.uiFont)) ? value.uiFont as Preferences["uiFont"] : defaults.uiFont,
      arabicFont: ["amiri", "tajawal"].includes(String(value.arabicFont)) ? value.arabicFont as Preferences["arabicFont"] : defaults.arabicFont,
      handles: Array.isArray(value.handles) ? value.handles : [],
      domains: Array.isArray(value.domains) ? value.domains.filter((domain): domain is string => typeof domain === "string" && /^(?:[a-z0-9-]+\.)*[a-z0-9-]+$/i.test(domain)) : [],
      blurStrength: Number.isFinite(blur) ? Math.max(0, Math.min(50, blur)) : defaults.blurStrength,
    };
  } catch {
    return defaults;
  }
}

export function savePreferences(value: Preferences) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    return false;
  }
  return true;
}

export function extensionPreferences(value: Preferences) {
  return {
    enabled: value.enabled,
    blur: value.blurStrength,
    domains: value.domains,
    theme: value.theme,
    accent: value.accent,
    font: value.uiFont,
    arabicFont: value.arabicFont,
    gender: value.gender,
  };
}