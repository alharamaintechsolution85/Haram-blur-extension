import AuthForm from "@/components/auth-form";

export async function generateMetadata() {
  return { title: "Create account | Haram Blur" };
}

export default function SignupPage() {
  return <main className="auth-page"><section className="auth-panel"><span className="eyebrow">Start with intention</span><h1>Create your account</h1><p className="panel-subtitle">Your account is managed by your configured Supabase project.</p><AuthForm mode="signup" /></section></main>;
}