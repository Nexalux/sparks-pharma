"use client";

import { useState, type FormEvent } from "react";
import Link from "../components/SafeLink";
import { authClient } from "../lib/auth-client";

export function ResetPassword({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await authClient.resetPassword({ newPassword: password, token });
    setNotice(result.error ? "This recovery link is invalid or has expired." : "Password updated. You can now sign in.");
  }
  return <section className="auth-card"><span className="kicker">ACCOUNT RECOVERY</span><h1>Choose a new password.</h1><p>Use at least 12 characters and avoid reusing a password from another service.</p><form className="auth-form" onSubmit={submit}><label><span>New password</span><input type="password" minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required /></label><button className="primary-action action-full" type="submit" disabled={!token}>Update password</button></form>{notice ? <p role="status" className="auth-notice">{notice}</p> : null}<Link href="/sign-in">Back to sign in</Link></section>;
}
