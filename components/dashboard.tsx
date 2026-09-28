"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { usePreferences } from "@/hooks/use-preferences";
import type { DashboardTheme, Platform, TrustedHandle } from "@/types/preferences";

const threshold = { strict: "60%", balanced: "75%", relaxed: "90%" };
const themeAccents: Record<DashboardTheme, string> = { pastel: "#2e7d32", light: "#52745a", dark: "#8db99b", emerald: "#059669", blue: "#2563a6", purple: "#7652a5", custom: "#2e7d32" };

function detectPlatform(input: string): Platform {
  const value = input.toLowerCase();
  if (value.includes("instagram.com")) return "Instagram";
  if (value.includes("tiktok.com")) return "TikTok";
  if (value.includes("facebook.com")) return "Facebook";
  if (value.includes("youtube.com") || value.includes("youtu.be")) return "YouTube";
  return "Other";
}

function normalizeHandle(input: string) {
  const value = input.trim();
  if (!value) return "";
  try {
    const url = new URL(value.startsWith("@") ? `https://example.com/${value.slice(1)}` : value.includes("://") ? value : `https://${value}`);
    const last = url.pathname.split("/").filter(Boolean).at(-1);
    return last ? (last.startsWith("@") ? last : `@${last}`) : value;
  } catch {
    return value.startsWith("@") ? value : `@${value}`;
  }
}

export default function Dashboard() {
  const { preferences, setPreferences, ready } = usePreferences();
  const [input, setInput] = useState("");
  const [relation, setRelation] = useState("Family");
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [quote, setQuote] = useState(false);

  useEffect(() => {
    setConsent(localStorage.getItem("haram-blur.consent.v1") !== "accepted");
    setQuote(true);
  }, []);

  function addHandle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const handle = normalizeHandle(input);
    if (!handle || handle.length > 120) {
      setError("Enter a social handle or profile link (up to 120 characters).");
      return;
    }
    if (preferences.handles.some((item) => item.handle.toLowerCase() === handle.toLowerCase())) {
      setError("That handle is already on your list.");
      return;
    }

    const item: TrustedHandle = {
      id: crypto.randomUUID(),
      handle,
      platform: detectPlatform(input),
      relation: relation.trim() || "Family",
    };
    setPreferences((current) => ({ ...current, handles: [...current.handles, item] }));
    setInput("");
    setError("");
  }

  function acceptConsent() {
    localStorage.setItem("haram-blur.consent.v1", "accepted");
    setConsent(false);
  }

  function removeHandle(id: string) {
    setPreferences((current) => ({ ...current, handles: current.handles.filter((item) => item.id !== id) }));
  }

  return (
    <div className="dashboard-shell" data-theme={preferences.theme}>
      <main className="page-wrap">
        <div className="page-heading">
          <div><span className="eyebrow">Your quiet corner</span><h1>Assalamu alaikum.</h1><p className="intro">Make room for a more intentional online day. Your preferences stay on this device.</p></div>
          <span className="date-note">{ready ? "Personal settings · This device" : "Loading your settings"}</span>
        </div>

        <section className="welcome-banner" aria-label="Haram Blur welcome">
          <Image src="/halalhero.jpg.jpeg" alt="" fill priority unoptimized sizes="(max-width: 760px) 100vw, 1160px" />
          <div className="welcome-copy"><span className="welcome-label">A mindful digital space</span><h2>Choose what deserves your attention.</h2></div>
        </section>

        <div className="layout-grid">
          <div className="main-column">
            <section className="panel panel-pad" aria-labelledby="preferences-title">
              <div className="panel-heading">
                <div><h2 className="panel-title" id="preferences-title">Personal preferences</h2><p className="panel-subtitle">Shape how Gaze Guard behaves for you.</p></div>
                <span className="status-pill"><span className="privacy-dot" />Saved locally</span>
              </div>
              <div className="setting-row">
                <div><p className="setting-label">Profile preference</p><p className="setting-hint">Saved locally; it does not classify anyone’s gender.</p></div>
                <div className="gender-switch" role="group" aria-label="Profile preference">
                  {(["male", "female"] as const).map((gender) => <button key={gender} type="button" className="gender-option" aria-pressed={preferences.gender === gender} onClick={() => setPreferences((value) => ({ ...value, gender }))}>{gender === "male" ? "Male" : "Female"}</button>)}
                </div>
              </div>
              <SettingToggle title="Media protection" hint="Syncs with the extension when its dashboard origin is configured." checked={preferences.enabled} onChange={() => setPreferences((value) => ({ ...value, enabled: !value.enabled }))} />
              <SettingToggle title="Tafakkur focus mode" hint="A local preference; site decluttering is not connected yet." checked={preferences.focusMode} onChange={() => setPreferences((value) => ({ ...value, focusMode: !value.focusMode }))} />
              <div className="setting-row">
                <div><p className="setting-label">Detection threshold</p><p className="setting-hint">{threshold[preferences.detectionMode]} confidence · Model integration not enabled</p></div>
                <select aria-label="Detection threshold" className="select-field" style={{ width: 132 }} value={preferences.detectionMode} onChange={(event) => setPreferences((value) => ({ ...value, detectionMode: event.target.value as typeof value.detectionMode }))}><option value="strict">Strict · 60%</option><option value="balanced">Balanced · 75%</option><option value="relaxed">Relaxed · 90%</option></select>
              </div>
              <div className="setting-row">
                <div><p className="setting-label">Blur appearance</p><p className="setting-hint">Preference for the extension styling layer.</p></div>
                <select aria-label="Blur appearance" className="select-field" style={{ width: 142 }} value={preferences.blurStyle} onChange={(event) => setPreferences((value) => ({ ...value, blurStyle: event.target.value as typeof value.blurStyle }))}><option value="glass">Soft glass</option><option value="mist">Gaussian mist</option><option value="pattern">Pattern</option><option value="pastel">Pastel wash</option></select>
              </div>
              <div className="setting-row">
                <div><p className="setting-label">Dashboard theme</p><p className="setting-hint">Choose a soft warm or muted slate palette.</p></div>
                <select aria-label="Dashboard theme" className="select-field" style={{ width: 142 }} value={preferences.theme} onChange={(event) => { const theme = event.target.value as DashboardTheme; setPreferences((value) => ({ ...value, theme, accent: themeAccents[theme] })); }}><option value="pastel">Pastel green</option><option value="light">Soft light</option><option value="dark">Deep slate</option><option value="emerald">Emerald</option><option value="blue">Deep blue</option><option value="purple">Purple</option></select>
              </div>
            </section>

            <section className="panel panel-pad" aria-labelledby="whitelist-title">
              <div className="panel-heading"><div><h2 className="panel-title" id="whitelist-title">Mehram list</h2><p className="panel-subtitle">Trusted profiles are kept on this device. Cloud sync is not connected.</p></div><span className="status-pill">{preferences.handles.length} profiles</span></div>
              <form className="whitelist-form" onSubmit={addHandle}>
                <label className="sr-only" htmlFor="handle-input">Social handle or profile link</label><input id="handle-input" className="field" value={input} onChange={(event) => setInput(event.target.value)} placeholder="@handle or profile link" maxLength={120} />
                <label className="sr-only" htmlFor="relation-input">Relation</label><input id="relation-input" className="field" value={relation} onChange={(event) => setRelation(event.target.value)} placeholder="Relation" maxLength={32} />
                <button className="button-primary" type="submit">Add profile</button>
                {error && <p className="form-error" role="alert">{error}</p>}
              </form>
              <div className="handle-list" aria-live="polite">
                {preferences.handles.length === 0 ? <div className="empty-state">Your list is empty. Add a trusted profile to get started.</div> : preferences.handles.map((item) => <div className="handle-item" key={item.id}><span className="handle-icon" aria-hidden="true">{item.platform === "Other" ? "@" : item.platform.slice(0, 1)}</span><div className="handle-copy"><p className="handle-name">{item.handle}</p><p className="handle-meta">{item.platform} · {item.relation}</p></div><button className="remove-button" type="button" aria-label={`Remove ${item.handle}`} onClick={() => removeHandle(item.id)}>×</button></div>)}
              </div>
            </section>

            <section className="panel panel-pad" aria-labelledby="knowledge-title">
              <div className="panel-heading"><div><h2 className="panel-title" id="knowledge-title">A little reflection</h2><p className="panel-subtitle">A thoughtful beginning for the knowledge hub.</p></div><span className="eyebrow">Knowledge</span></div>
              <article><a className="article-link" href="/articles/haya-and-digital-presence"><h3>Haya: a practice of mindful presence</h3><p>Reflecting on modesty as an inward quality that shapes how we move through public and digital life.</p></a><a className="article-link" href="/articles/guarding-the-gaze"><h3>Guarding the gaze in a connected world</h3><p>Practical questions for building healthier habits around feeds, attention, and online boundaries.</p></a></article>
            </section>
          </div>

          <aside className="side-column" aria-label="Reflection and activity">
            <section className="panel verse-panel"><div className="panel-pad"><span className="eyebrow">A reminder</span><p className="arabic" lang="ar" dir="rtl">قُل لِّلْمُؤْمِنِينَ يَغُضُّوا مِنْ أَبْصَارِهِمْ</p><p className="verse-translation">“Tell the believing men to lower their gaze...”</p><p className="reference">Qur’an · An-Nur 24:30</p><p className="verse-translation" style={{ marginTop: 17, fontSize: 13 }}>“The adultery of the eye is the lustful look.”</p><p className="reference">Sahih Muslim · 2657a</p></div></section>
            <section className="panel panel-pad metric-panel" aria-labelledby="impact-title"><div className="panel-heading"><div><h2 className="panel-title" id="impact-title">Your impact</h2><p className="panel-subtitle">A private snapshot, stored locally.</p></div><span className="eyebrow">Today</span></div><div className="metric-grid"><div className="metric-tile"><p className="metric-value">{preferences.filteredCount}</p><p className="metric-label">Media filtered</p></div><div className="metric-tile"><p className="metric-value">{Math.floor(preferences.focusMinutes / 60)}h</p><p className="metric-label">Intentional time</p></div></div><p className="metric-note">Activity counters are a foundation only; automatic tracking is not active.</p></section>
            <section className="panel panel-pad"><div className="panel-heading"><div><h2 className="panel-title">Privacy, by design</h2><p className="panel-subtitle">A clear view of what happens today.</p></div></div><div className="privacy-detail"><span className="privacy-dot" /><div><strong>Your dashboard stays here</strong>Preferences and trusted profiles are stored in this browser. This starter does not upload media or run an image classifier.</div></div></section>
          </aside>
        </div>
      </main>

      {quote && <aside className="toast" aria-live="polite"><div className="toast-head"><p className="toast-title">Daily reminder</p><button className="toast-close" type="button" aria-label="Dismiss reminder" onClick={() => setQuote(false)}>×</button></div><p className="toast-text">“Tell the believing men to lower their gaze and guard their chastity.”</p><p className="toast-reference">Qur’an · An-Nur 24:30</p></aside>}
      {consent && <div className="overlay"><section className="consent-dialog" role="dialog" aria-modal="true" aria-labelledby="consent-title"><span className="eyebrow">Before you begin</span><h2 id="consent-title">Your data stays yours.</h2><p>This dashboard stores settings and profile handles in this browser’s local storage. The starter does not send images, handles, or analytics to a server. The extension’s basic blur runs in your browser; AI detection and account sync are not included yet.</p><p>Only continue on a device where you trust the local browser profile.</p><div className="consent-actions"><button className="button-primary" type="button" onClick={acceptConsent}>I understand</button></div></section></div>}
    </div>
  );
}

function SettingToggle({ title, hint, checked, onChange }: { title: string; hint: string; checked: boolean; onChange: () => void }) {
  return <div className="setting-row"><div><p className="setting-label">{title}</p><p className="setting-hint">{hint}</p></div><button className="switch" type="button" role="switch" aria-checked={checked} aria-label={title} onClick={onChange} /></div>;
}