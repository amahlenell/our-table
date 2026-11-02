"use client";
import { use, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { z } from "zod";
import { browserSupabase, reloadForAuth } from "@/lib/supabase/client";
import { useApp } from "@/features/app-provider";
import { Button } from "@/components/ui/button";
export default function AuthPage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = use(params);
  const { configured } = useApp();
  const signup = mode === "signup",
    recover = mode === "recovery",
    update = mode === "update-password";
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  async function submit() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const db = browserSupabase();
      if (!update) z.email().parse(email);
      if (!recover)
        z.string()
          .min(12, "Use a password of at least 12 characters.")
          .max(200)
          .parse(password);
      if (signup) {
        z.string().trim().min(1).max(100).parse(name);
        const result = await db.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name },
            emailRedirectTo: window.location.origin + "/auth/callback",
          },
        });
        if (result.error) throw result.error;
        if (result.data.session) reloadForAuth("/settings");
        else
          setMessage("Check your email to confirm your account, then sign in.");
      } else if (recover) {
        const result = await db.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/auth/callback?type=recovery",
        });
        if (result.error) throw result.error;
        setMessage(
          "If that account exists, a password reset link is on its way.",
        );
      } else if (update) {
        const result = await db.auth.updateUser({ password });
        if (result.error) throw result.error;
        reloadForAuth("/settings");
      } else {
        const result = await db.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        reloadForAuth("/");
      }
    } catch (e) {
      setError(
        e instanceof z.ZodError ? e.issues[0].message : (e as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page" id="main-content">
      <section className="auth-story">
        <Brand />
        <div>
          <span className="eyebrow">GOOD FOOD. SHARED.</span>
          <h1>
            A home for the
            <br />
            food you love.
          </h1>
          <p>
            A thoughtful recipe book for your everyday kitchen.
            <br />A little planning. More time together.
          </p>
        </div>
        <span>Gather your favourites. Make something good.</span>
      </section>
      <section className="auth-form-wrap">
        <form
          className="auth-form stack"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <span className="eyebrow">YOUR EVERYDAY KITCHEN</span>
          <h1>
            {signup
              ? "Make yourself at home."
              : recover
                ? "A fresh start."
                : update
                  ? "Choose a new password."
                  : "Welcome home."}
          </h1>
          <p className="muted">
            {signup
              ? "Start a recipe book you can share."
              : recover
                ? "We’ll send you a link to reset your password."
                : "Good to have you back in the kitchen."}
          </p>
          {!configured && (
            <p className="callout">
              Account services need Supabase configuration. See the included
              setup guide.
            </p>
          )}
          {signup && (
            <label>
              Your name
              <input
                required
                autoComplete="name"
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}
          {!update && (
            <label>
              Email address
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          )}
          {!recover && (
            <label>
              Password
              <input
                required
                type="password"
                minLength={12}
                autoComplete={
                  signup || update ? "new-password" : "current-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <small>At least 12 characters.</small>
            </label>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="callout" role="status">
              {message}
            </p>
          )}
          <Button disabled={busy || !configured}>
            {busy
              ? "One moment…"
              : signup
                ? "Create your account"
                : recover
                  ? "Send reset link"
                  : update
                    ? "Update password"
                    : "Sign in"}
            <ArrowRight size={17} />
          </Button>
          <div className="auth-links">
            {!signup && <Link href="/auth/signup">Create an account</Link>}
            {signup && (
              <Link href="/auth/login">Already at home here? Sign in</Link>
            )}
            {!recover && !update && (
              <Link href="/auth/recovery">Forgot password?</Link>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
