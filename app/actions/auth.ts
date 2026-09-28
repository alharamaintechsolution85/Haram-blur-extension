"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  message?: string;
}

export async function signIn(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  if (!supabase) return { error: "Authentication is not configured. Add the Supabase URL and anon/publishable key to .env.local." };
  if (!email || !password) return { error: "Enter your email and password." };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "We could not sign you in with those details." };
  redirect("/dashboard");
}

export async function signUp(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  if (!supabase) return { error: "Authentication is not configured. Add the Supabase URL and anon/publishable key to .env.local." };
  if (!email || password.length < 8) return { error: "Use a valid email and a password of at least eight characters." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${siteUrl}/auth/callback` } });
  if (error) return { error: "We could not create an account with those details." };
  if (data.session) redirect("/dashboard");
  return { message: "Account created. Check your email to confirm your address, then sign in." };
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/auth/login");
}