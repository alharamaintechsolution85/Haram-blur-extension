"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});

  return <form className="auth-form" action={formAction}>
    <label htmlFor="email">Email address</label><input className="field" id="email" name="email" type="email" autoComplete="email" required />
    <label htmlFor="password">Password</label><input className="field" id="password" name="password" type="password" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required />
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    {state.message && <p className="form-success" role="status">{state.message}</p>}
    <button className="button-primary auth-submit" type="submit" disabled={pending}>{pending ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</button>
    <p className="auth-switch">{mode === "login" ? "New here?" : "Already have an account?"} <Link href={mode === "login" ? "/auth/signup" : "/auth/login"}>{mode === "login" ? "Create an account" : "Sign in"}</Link></p>
  </form>;
}