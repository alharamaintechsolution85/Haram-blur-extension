import { redirect } from "next/navigation";
import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = supabase ? await supabase.auth.getClaims() : { data: { claims: null } };
  const claims = data?.claims;
  if (supabase && !claims) redirect("/auth/login");

  const email = typeof claims?.email === "string" ? claims.email : null;
  return <AppShell email={email} authConfigured={Boolean(supabase)}>{children}</AppShell>;
}