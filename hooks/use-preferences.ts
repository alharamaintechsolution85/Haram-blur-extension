"use client";

import { createContext, createElement, useContext, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { defaults, extensionPreferences, readPreferences, savePreferences, storageKey } from "@/lib/preferences";
import type { Preferences } from "@/types/preferences";

interface PreferencesContextValue {
  preferences: Preferences;
  setPreferences: Dispatch<SetStateAction<Preferences>>;
  ready: boolean;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPreferences(readPreferences());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    savePreferences(preferences);
    window.postMessage({ source: "haram-blur-dashboard", type: "SETTINGS_SYNC", preferences: extensionPreferences(preferences) }, window.location.origin);
  }, [preferences, ready]);

  useEffect(() => {
    function receiveExtensionSettings(event: MessageEvent) {
      if (event.source !== window || event.data?.source !== "halal-vision-extension" || event.data?.type !== "SETTINGS_UPDATED") return;
      const incoming = event.data.preferences as Partial<Preferences> & { blur?: unknown; font?: unknown };
      setPreferences((current) => ({
        ...current,
        enabled: typeof incoming.enabled === "boolean" ? incoming.enabled : current.enabled,
        gender: incoming.gender === "male" || incoming.gender === "female" ? incoming.gender : current.gender,
        blurStrength: Number.isFinite(incoming.blurStrength ?? incoming.blur) ? Math.max(0, Math.min(50, Number(incoming.blurStrength ?? incoming.blur))) : current.blurStrength,
        domains: Array.isArray(incoming.domains) ? incoming.domains.filter((domain): domain is string => typeof domain === "string") : current.domains,
        theme: incoming.theme ?? current.theme,
        accent: incoming.accent ?? current.accent,
        uiFont: ["system", "inter", "outfit", "roboto"].includes(String(incoming.uiFont ?? incoming.font)) ? (incoming.uiFont ?? incoming.font) as Preferences["uiFont"] : current.uiFont,
        arabicFont: incoming.arabicFont ?? current.arabicFont,
      }));
    }
    window.addEventListener("message", receiveExtensionSettings);
    return () => window.removeEventListener("message", receiveExtensionSettings);
  }, []);

  useEffect(() => {
    function readOtherTab(event: StorageEvent) {
      if (event.key === storageKey) setPreferences(readPreferences());
    }
    window.addEventListener("storage", readOtherTab);
    return () => window.removeEventListener("storage", readOtherTab);
  }, []);

  return createElement(PreferencesContext.Provider, { value: { preferences, setPreferences, ready } }, children);
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("usePreferences must be used inside PreferencesProvider");
  return context;
}