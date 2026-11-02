"use client";
import { useState } from "react";
import { Users, Leaf, Copy, LogOut, Mail, KeyRound } from "lucide-react";
import Link from "next/link";
import { useApp, api } from "@/features/app-provider";
import { browserSupabase, reloadForAuth } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
export default function Settings() {
  const { data, demo, updateProfile, refresh, toast } = useApp();
  const [name, setName] = useState(data.profile.name),
    [house, setHouse] = useState("Our little kitchen"),
    [email, setEmail] = useState(""),
    [token, setToken] = useState(""),
    [invite, setInvite] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-enter settings-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h1>Your kitchen, your way.</h1>
          <p>A few details for you and the people you cook with.</p>
        </div>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="settings-grid">
        <section className="form-section">
          <h2>A little about you.</h2>
          <div className="profile-preview">
            <span className="avatar large">{data.profile.name[0]}</span>
            <div>
              <strong>{data.profile.name}</strong>
              <p className="muted">
                {demo ? "Local demo profile" : "Your personal cooking profile"}
              </p>
            </div>
          </div>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              void act(() => updateProfile(name));
            }}
          >
            <label>
              Display name
              <input
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <Button disabled={busy}>Save profile</Button>
          </form>
          <div className="account-links">
            <Link href="/auth/recovery">
              <KeyRound size={15} />
              Reset password
            </Link>
            {!demo && (
              <button
                onClick={() =>
                  void act(async () => {
                    const { error } = await browserSupabase().auth.signOut();
                    if (error) throw error;
                    reloadForAuth("/auth/login");
                  })
                }
              >
                <LogOut size={15} />
                Sign out
              </button>
            )}
          </div>
        </section>
        <section className="form-section">
          <h2>
            <Users size={23} /> {data.household?.name || "A shared kitchen."}
          </h2>
          {data.household ? (
            <>
              <p className="muted">
                Recipes and plans are shared. Notes, ratings, and favourites
                stay personal.
              </p>
              {data.members.map((m) => (
                <div className="member-row" key={m.id}>
                  <span className="avatar">{m.name[0]}</span>
                  <strong>{m.name}</strong>
                  <span className="pill">
                    {m.id === data.profile.id ? "You" : "Household member"}
                  </span>
                </div>
              ))}
              {data.members.length < 2 ? (
                <form
                  className="stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void act(async () => {
                      if (demo)
                        throw new Error(
                          "Invitations require a connected Supabase account.",
                        );
                      const result = await api<{ token: string }>(
                        "invitation",
                        { email },
                      );
                      setInvite(result.token);
                      toast(
                        "Invitation created. Share the token with your partner.",
                      );
                    });
                  }}
                >
                  <label>
                    <Mail size={15} />
                    Invite your partner’s email
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <Button disabled={busy}>Create invitation</Button>
                </form>
              ) : (
                <p className="callout">
                  <Leaf size={16} />
                  Your kitchen has its two cooks.
                </p>
              )}
              {invite && (
                <div className="invitation-output">
                  <p>
                    Share this one-time token with the invited person. It
                    expires in 48 hours. No email was sent.
                  </p>
                  <code>{invite}</code>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      void navigator.clipboard
                        .writeText(invite)
                        .then(() => toast("Invitation copied."))
                        .catch(() => toast("Select and copy the token above."))
                    }
                  >
                    <Copy size={15} />
                    Copy token
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="muted">
                Start your own household, or join your partner’s with their
                invitation token.
              </p>
              <form
                className="stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  void act(async () => {
                    await api("household", { name: house });
                    await refresh();
                    toast("Your household is ready.");
                  });
                }}
              >
                <label>
                  Household name
                  <input
                    required
                    maxLength={100}
                    value={house}
                    onChange={(e) => setHouse(e.target.value)}
                  />
                </label>
                <Button disabled={busy}>Create household</Button>
              </form>
              <div className="divider-label">or join a kitchen</div>
              <form
                className="stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  void act(async () => {
                    await api("join", { token: token.trim() });
                    setToken("");
                    await refresh();
                    toast("Welcome to your shared kitchen.");
                  });
                }}
              >
                <label>
                  Invitation token
                  <input
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    autoComplete="off"
                  />
                </label>
                <p className="muted small-text">
                  Sign in with the verified email address that was invited.
                </p>
                <Button disabled={busy} variant="secondary">
                  Join household
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
      {demo && (
        <p className="callout">
          This is a local sample kitchen. Browser storage is used for your
          changes; accounts and household sharing require Supabase. Clearing
          your browser’s site data resets the demo.
        </p>
      )}
    </div>
  );
}
