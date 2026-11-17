"use client";

import { useState, type FormEvent } from "react";
import Link from "../components/SafeLink";
import { authClient } from "../lib/auth-client";

export function AuthExperience({ returnTo, emailEnabled, googleEnabled, localMode, signedOut, initialMode = "sign-in" }: { returnTo: string; emailEnabled: boolean; googleEnabled: boolean; localMode: boolean; signedOut: boolean; initialMode?: "sign-in" | "create" }) {
  const [mode, setMode] = useState<"sign-in" | "create">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(signedOut ? "You have been signed out securely." : "");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!emailEnabled) return;
    setBusy(true); setError(""); setNotice("");
    const result = mode === "create"
      ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password, callbackURL: returnTo })
      : await authClient.signIn.email({ email: email.trim(), password, callbackURL: returnTo });
    setBusy(false);
    if (result.error) setError("We could not complete that request. Check your details or verify your email, then try again.");
    else if (mode === "create") setNotice("Check your inbox for a verification link. Your quote will remain here while you verify your email.");
    else window.location.assign(returnTo);
  }

  async function forgotPassword() {
    if (!emailEnabled || !email.trim()) { setError("Enter your email address first."); return; }
    setBusy(true); setError("");
    const result = await authClient.requestPasswordReset({ email: email.trim(), redirectTo: "/reset-password" });
    setBusy(false);
    setNotice(result.error ? "If this address has an account, recovery instructions will be sent when email delivery is available." : "If this address has an account, recovery instructions are on the way.");
  }

  async function googleSignIn() {
    setBusy(true); setError("");
    const result = await authClient.signIn.social({ provider: "google", callbackURL: returnTo });
    if (result?.error) { setBusy(false); setError("Google sign-in could not be started."); }
  }

  return <section className="auth-card">
    <div className="auth-brand"><span className="brand-mark" aria-hidden="true">✦</span><span>SPARKS <b>PHARMA</b></span></div>
    <span className="kicker">SECURE MEMBER ACCESS</span>
    <h1>{mode === "create" ? "Create your trade workspace." : "Welcome back."}</h1>
    <p>{mode === "create" ? "Save quote drafts, keep buyer details ready, and follow enquiry progress from one place." : "Sign in to continue with your quote, workspace, or admin dashboard."}</p>
    {googleEnabled ? <button className="google-auth-button" type="button" onClick={googleSignIn} disabled={busy}><span aria-hidden="true">G</span> Continue with Google</button> : null}
    {googleEnabled && emailEnabled ? <div className="auth-divider"><span>or continue with email</span></div> : null}
    <form className="auth-form" onSubmit={submit}>
      {mode === "create" ? <label><span>Full name</span><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></label> : null}
      <label><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
      <label><span>Password</span><input type="password" minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "create" ? "new-password" : "current-password"} required /><small>{mode === "create" ? "Use at least 12 characters." : null}</small></label>
      <button className="primary-action action-full" type="submit" disabled={busy || !emailEnabled}>{busy ? "Please wait…" : mode === "create" ? "Create account" : "Sign in"} <span>→</span></button>
    </form>
    {localMode ? <p className="auth-setup-note" role="status">Local preview accounts are separate from the public site. Create a local account here to test the member workspace.</p> : null}
    {!emailEnabled && !googleEnabled ? <p className="auth-setup-note" role="status">Email and Google sign-in are waiting for their secure provider credentials.</p> : null}
    {notice ? <p className="auth-notice" role="status">{notice}</p> : null}
    {error ? <p className="submission-error" role="alert">{error}</p> : null}
    <div className="auth-secondary-actions">
      <button type="button" onClick={() => { setMode(mode === "create" ? "sign-in" : "create"); setError(""); }}>{mode === "create" ? "Already have an account? Sign in" : "New here? Create an account"}</button>
      {mode === "sign-in" && !localMode ? <button type="button" onClick={forgotPassword}>Forgot password?</button> : null}
    </div>
    <Link className="text-button" href="/">Return to catalog</Link>
  </section>;
}
