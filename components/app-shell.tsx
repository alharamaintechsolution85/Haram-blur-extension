"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { PreferencesProvider, usePreferences } from "@/hooks/use-preferences";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/settings", label: "Settings", icon: "⚙" },
  { href: "/profile", label: "Profile", icon: "◉" },
];

export default function AppShell({ children, email, authConfigured }: { children: React.ReactNode; email: string | null; authConfigured: boolean }) {
  return <PreferencesProvider><WorkspaceFrame email={email} authConfigured={authConfigured}>{children}</WorkspaceFrame></PreferencesProvider>;
}

function WorkspaceFrame({ children, email, authConfigured }: { children: React.ReactNode; email: string | null; authConfigured: boolean }) {
  const pathname = usePathname();
  const { preferences } = usePreferences();
  const font = { system: '"Aptos", "Segoe UI", sans-serif', inter: 'Inter, sans-serif', outfit: 'Outfit, sans-serif', roboto: 'Roboto, sans-serif' }[preferences.uiFont];
  const arabicFont = preferences.arabicFont === "amiri" ? "Amiri, Georgia, serif" : "Tajawal, sans-serif";

  return <div className="workspace-shell" data-theme={preferences.theme} style={{ "--sage": preferences.accent, "--ui-font": font, "--arabic-font": arabicFont } as React.CSSProperties}>
    <aside className="workspace-sidebar">
      <Link className="workspace-brand" href="/dashboard"><span className="workspace-logo"><Image src="/halallogo.jpg.jpeg" alt="" fill unoptimized sizes="56px" /></span><span><strong>Haram Blur</strong><small>Gaze Guard</small></span></Link>
      <p className="nav-caption">Workspace</p>
      <nav className="workspace-nav" aria-label="Main navigation">{links.map((item) => <Link key={item.href} className={pathname === item.href ? "nav-link active" : "nav-link"} href={item.href} aria-current={pathname === item.href ? "page" : undefined}><span aria-hidden="true">{item.icon}</span>{item.label}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-privacy"><span className="privacy-dot" /><span>Local-first preferences</span></div>{authConfigured ? <form action={signOut}><button className="signout-button" type="submit">Sign out</button></form> : <Link className="signout-button" href="/auth/login">Connect account</Link>}</div>
    </aside>
    <div className="workspace-main">
      <header className="workspace-topbar"><div className="mobile-brand"><span className="workspace-logo"><Image src="/halallogo.jpg.jpeg" alt="" fill unoptimized sizes="46px" /></span><strong>Haram Blur</strong></div><div className="workspace-topbar-right">{!authConfigured && <span className="auth-state">Local mode · Auth not configured</span>}{email && <span className="account-email">{email}</span>}<Link className="topbar-profile" href="/profile" aria-label="Open profile">{email?.slice(0, 1).toUpperCase() ?? "H"}</Link></div></header>
      <div className="workspace-content">{children}</div>
    </div>
  </div>;
}