"use client";

import { useState, type FormEvent } from "react";
import { usePreferences } from "@/hooks/use-preferences";
import type { DashboardTheme } from "@/types/preferences";

const themes: { id: DashboardTheme; name: string; color: string }[] = [
  { id: "pastel", name: "Pastel green", color: "#2e7d32" },
  { id: "light", name: "Soft light", color: "#52745a" },
  { id: "dark", name: "Deep slate", color: "#8db99b" },
  { id: "emerald", name: "Emerald", color: "#059669" },
  { id: "blue", name: "Deep blue", color: "#2563a6" },
  { id: "purple", name: "Purple", color: "#7652a5" },
];

export default function SettingsPanel() {
  const { preferences, setPreferences } = usePreferences();
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");

  function addDomain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let hostname: string;
    try {
      const input = domain.trim();
      const url = new URL(input.includes("://") ? input : `https://${input}`);
      if (!url.hostname.includes(".")) throw new Error();
      hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      setError("Enter a website domain, such as example.com.");
      return;
    }
    if (preferences.domains.includes(hostname)) {
      setError("That domain is already trusted.");
      return;
    }
    setPreferences((current) => ({ ...current, domains: [...current.domains, hostname] }));
    setDomain("");
    setError("");
  }

  function chooseTheme(theme: DashboardTheme, accent: string) {
    setPreferences((current) => ({ ...current, theme, accent }));
  }

  return <div className="settings-page">
    <header className="route-heading"><div><span className="eyebrow">Personalize</span><h1>Settings</h1><p>These preferences stay in this browser and sync to Gaze Guard when its extension bridge is configured.</p></div><span className="status-pill"><span className="privacy-dot" />Saved on this device</span></header>
    <section className="panel panel-pad settings-section"><div className="panel-heading"><div><h2 className="panel-title">Profile preference</h2><p className="panel-subtitle">Saved locally; it does not classify anyone’s gender. Face blur applies to detected face regions.</p></div></div><div className="gender-switch" role="group" aria-label="Profile preference">{(["male", "female"] as const).map((gender) => <button key={gender} type="button" className="gender-option" aria-pressed={preferences.gender === gender} onClick={() => setPreferences((current) => ({ ...current, gender }))}>{gender === "male" ? "Male" : "Female"}</button>)}</div></section>
    <section className="panel panel-pad settings-section"><div className="panel-heading"><div><h2 className="panel-title">Color theme</h2><p className="panel-subtitle">Choose a palette, then tune its accent if you like.</p></div></div><div className="theme-options" role="group" aria-label="Color theme">{themes.map((theme) => <button type="button" key={theme.id} className="theme-option" aria-pressed={preferences.theme === theme.id} onClick={() => chooseTheme(theme.id, theme.color)}><span className="theme-swatch" style={{ background: theme.color }} /><span>{theme.name}</span></button>)}</div><label className="setting-row color-row"><span><span className="setting-label">Custom accent</span><span className="setting-hint">Choose a color for active controls and highlights.</span></span><input aria-label="Custom accent color" type="color" value={preferences.accent} onChange={(event) => chooseTheme("custom", event.target.value)} /></label></section>
    <section className="panel panel-pad settings-section"><div className="panel-heading"><div><h2 className="panel-title">Typography</h2><p className="panel-subtitle">Font choices use installed fonts only; no remote font requests are made.</p></div></div><div className="form-grid"><label className="form-control"><span>Interface font</span><select className="select-field" value={preferences.uiFont} onChange={(event) => setPreferences((current) => ({ ...current, uiFont: event.target.value as typeof current.uiFont }))}><option value="system">System default</option><option value="inter">Inter</option><option value="outfit">Outfit</option><option value="roboto">Roboto</option></select></label><label className="form-control"><span>Arabic font</span><select className="select-field" value={preferences.arabicFont} onChange={(event) => setPreferences((current) => ({ ...current, arabicFont: event.target.value as typeof current.arabicFont }))}><option value="amiri">Amiri</option><option value="tajawal">Tajawal</option></select></label></div></section>
    <section className="panel panel-pad settings-section"><div className="panel-heading"><div><h2 className="panel-title">Media blur</h2><p className="panel-subtitle">This controls the extension’s local CSS blur strength.</p></div><output className="blur-output">{preferences.blurStrength}px</output></div><label className="range-control"><span className="sr-only">Blur strength in pixels</span><input type="range" min="0" max="50" value={preferences.blurStrength} onChange={(event) => setPreferences((current) => ({ ...current, blurStrength: Number(event.target.value) }))} /><span className="range-endpoints"><span>0px · clear</span><span>50px · strong</span></span></label><label className="setting-row media-toggle"><span><span className="setting-label">Protection enabled</span><span className="setting-hint">The extension applies blur only when enabled.</span></span><button className="switch" type="button" role="switch" aria-checked={preferences.enabled} aria-label="Enable media protection" onClick={() => setPreferences((current) => ({ ...current, enabled: !current.enabled }))} /></label></section>
    <section className="panel panel-pad settings-section"><div className="panel-heading"><div><h2 className="panel-title">Trusted websites</h2><p className="panel-subtitle">Media on these domains is never blurred by the extension.</p></div><span className="status-pill">{preferences.domains.length} domains</span></div><form className="domain-form" onSubmit={addDomain}><label className="sr-only" htmlFor="web-domain">Website domain</label><input id="web-domain" className="field" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="example.com" maxLength={180} /><button className="button-primary" type="submit">Add domain</button>{error && <p className="form-error" role="alert">{error}</p>}</form><ul className="trusted-domain-list">{preferences.domains.map((item) => <li key={item}><span>{item}</span><button className="remove-button" type="button" aria-label={`Remove ${item}`} onClick={() => setPreferences((current) => ({ ...current, domains: current.domains.filter((value) => value !== item) }))}>×</button></li>)}{preferences.domains.length === 0 && <li className="domain-empty">No websites added.</li>}</ul></section>
  </div>;
}