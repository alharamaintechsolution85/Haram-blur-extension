import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data } = supabase ? await supabase.auth.getClaims() : { data: { claims: null } };
  const claims = data?.claims;
  const email = typeof claims?.email === "string" ? claims.email : null;

  return <section className="panel panel-pad"><span className="eyebrow">Account</span><h1 className="route-title">Your profile</h1><p className="panel-subtitle">Manage the account associated with this browser.</p><div className="setting-row"><div><p className="setting-label">{email ?? "Local profile"}</p><p className="setting-hint">{email ? "Signed in with your Supabase account." : "This browser is using local mode. Configure Supabase to enable accounts."}</p></div>{!email && <Link className="button-secondary" href="/auth/login">Sign in</Link>}</div><div className="setting-row"><div><p className="setting-label">Preferences</p><p className="setting-hint">Your current display and privacy choices.</p></div><Link className="button-secondary" href="/settings">Open settings</Link></div></section>;
}