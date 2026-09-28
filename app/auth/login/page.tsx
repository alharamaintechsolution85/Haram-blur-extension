import AuthForm from "@/components/auth-form";

export async function generateMetadata() {
  return { title: "Sign in | Haram Blur" };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <main className="auth-page"><section className="auth-panel"><span className="eyebrow">Welcome back</span><h1>Sign in</h1><p className="panel-subtitle">Continue to your personal Gaze Guard space.</p>{params.registered && <p className="form-success">Account created. Check your email, then sign in.</p>}{params.error && <p className="form-error" role="alert">That confirmation link is missing or expired. Try signing in again.</p>}<AuthForm mode="login" /></section></main>;
}