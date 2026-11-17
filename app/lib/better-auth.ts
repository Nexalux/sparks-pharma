import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { drizzle } from "drizzle-orm/d1";
import * as authSchema from "../../db/schema";
import { authAccounts, authSessions, authUsers, authVerifications } from "../../db/schema";
import { runtimeBindings } from "./runtime";

export function hasAuthDatabase() { return Boolean(runtimeBindings().DB); }

export function isLocalAuth() {
  const baseURL = runtimeBindings().BETTER_AUTH_URL || "";
  try {
    const hostname = new URL(baseURL).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function authCapabilities() {
  const current = runtimeBindings();
  const local = isLocalAuth();
  return {
    email: Boolean(current.DB && current.BETTER_AUTH_SECRET && current.BETTER_AUTH_URL && (local || (current.BREVO_API_KEY && current.BREVO_SENDER_EMAIL))),
    google: Boolean(current.DB && current.BETTER_AUTH_SECRET && current.BETTER_AUTH_URL && current.GOOGLE_CLIENT_ID && current.GOOGLE_CLIENT_SECRET),
    local,
  };
}

async function sendBrevoEmail(to: string, subject: string, htmlContent: string, textContent: string) {
  const current = runtimeBindings();
  if (!current.BREVO_API_KEY || !current.BREVO_SENDER_EMAIL) {
    throw new Error("Transactional email is not configured.");
  }
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": current.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { email: current.BREVO_SENDER_EMAIL, name: current.BREVO_SENDER_NAME || "Sparks Pharma" },
      to: [{ email: to }],
      subject,
      htmlContent,
      textContent,
      tags: ["sparks-auth"],
    }),
  });
  if (!response.ok) throw new Error("The authentication email could not be delivered.");
}

function mailTemplate(title: string, message: string, action: string, url: string) {
  const safeUrl = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return `<!doctype html><html><body style="margin:0;background:#eef4f8;font-family:Arial,sans-serif;color:#08233b"><div style="max-width:560px;margin:32px auto;background:white;border-radius:18px;padding:32px"><div style="color:#1678d2;font-weight:800;letter-spacing:.12em">SPARKS PHARMA</div><h1 style="font-size:28px">${title}</h1><p style="line-height:1.65;color:#496579">${message}</p><p><a href="${safeUrl}" style="display:inline-block;background:#0b5cab;color:white;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:700">${action}</a></p><p style="font-size:12px;color:#6c8292">If you did not request this, you can ignore this message.</p></div></body></html>`;
}

export function createAuth() {
  const current = runtimeBindings();
  if (!current.DB) throw new Error("Authentication database is unavailable.");
  if (!current.BETTER_AUTH_SECRET) throw new Error("Authentication secret is unavailable.");
  const local = isLocalAuth();
  const socialProviders = current.GOOGLE_CLIENT_ID && current.GOOGLE_CLIENT_SECRET ? {
    google: {
      clientId: current.GOOGLE_CLIENT_ID,
      clientSecret: current.GOOGLE_CLIENT_SECRET,
      prompt: "select_account" as const,
      requireEmailVerification: true,
    },
  } : {};
  return betterAuth({
    appName: "Sparks Pharma",
    baseURL: current.BETTER_AUTH_URL || "http://localhost:3000",
    secret: current.BETTER_AUTH_SECRET,
    database: drizzleAdapter(drizzle(current.DB, { schema: authSchema }), {
      provider: "sqlite",
      schema: { user: authUsers, session: authSessions, account: authAccounts, verification: authVerifications },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: !local,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await sendBrevoEmail(user.email, "Reset your Sparks Pharma password", mailTemplate("Reset your password", "Use this secure link to choose a new password. The link expires automatically.", "Reset password", url), `Reset your Sparks Pharma password: ${url}`);
      },
    },
    emailVerification: {
      sendOnSignUp: !local,
      sendOnSignIn: !local,
      autoSignInAfterVerification: true,
      expiresIn: 3600,
      sendVerificationEmail: async ({ user, url }) => {
        await sendBrevoEmail(user.email, "Verify your Sparks Pharma email", mailTemplate("Verify your email", "Confirm this address to activate your member workspace and submit trade enquiries.", "Verify email", url), `Verify your Sparks Pharma email: ${url}`);
      },
    },
    socialProviders,
    account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },
    session: { expiresIn: 60 * 60 * 24 * 14, updateAge: 60 * 60 * 24 },
    advanced: { useSecureCookies: current.BETTER_AUTH_URL?.startsWith("https://") ?? false },
    plugins: [nextCookies()],
  });
}
