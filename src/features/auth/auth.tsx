"use client";

import React, { useState } from "react";
import { Icon, Logo, Button } from "@/components/ui";
import { useBz } from "@/components/common";
import { ASSETS } from "@/config/assets";
import { defaultScreenForUser } from "@/lib/auth-rbac";
import { useLogin, useRegister } from "@/hooks/use-auth";
import { getGoogleLoginUrl } from "@/services/api/auth";
import { ApiRequestError } from "@/services/api/http";
import type { AuthUser } from "@/types/auth";

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 52,
  border: "1.5px solid var(--line-200)",
  borderRadius: "var(--r-md)",
  padding: "0 16px",
  fontSize: "1rem",
  fontFamily: "var(--font-sans)",
  outline: "none",
  background: "#fff",
  color: "var(--ink-900)",
};

export function Splash() {
  const { nav } = useBz();
  const goAuth = () => nav("auth");

  const heroButtonStyle: React.CSSProperties = {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    margin: "0 auto",
    padding: "48px 28px 0",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    color: "inherit",
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 110px)",
        background: "var(--page)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <button
        type="button"
        onClick={goAuth}
        style={heroButtonStyle}
        aria-label="Continue to sign in"
      >
        <img
          src={ASSETS.mascot}
          alt=""
          className="bz-auth-hero-img"
          style={{ width: 240, height: 240, objectFit: "contain", margin: "0 auto 28px" }}
        />
        <h1
          className="bz-hero-h2"
          style={{ margin: 0, fontWeight: 800, color: "var(--blue-deep)", letterSpacing: "-.02em" }}
        >
          Nepal's <span style={{ color: "var(--red)" }}>fair</span> marketplace
        </h1>
        <p
          className="ne"
          style={{ color: "var(--ink-500)", fontSize: "1.0625rem", margin: "12px 0 6px" }}
        >
          नेपालको इमानदार बजार
        </p>
        <p
          style={{
            color: "var(--ink-500)",
            fontSize: "1rem",
            margin: 0,
            maxWidth: 360,
            marginInline: "auto",
          }}
        >
          Low fees. Real product videos. Fast delivery across Nepal.
        </p>
      </button>

      <div style={{ padding: "24px 28px 40px", maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <Button variant="primary" size="lg" full iconRight="arrowRight" onClick={goAuth}>
          Get started · सुरु गर्नुहोस्
        </Button>
        <Button variant="ghost" full onClick={() => nav("home")} style={{ marginTop: 10 }}>
          Skip — browse as guest · पछि गर्ने
        </Button>
        <p
          style={{
            textAlign: "center",
            color: "var(--ink-400)",
            fontSize: ".8125rem",
            marginTop: 14,
          }}
        >
          Tap the hero or Get started to continue
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14, textAlign: "left" }}>
      <label
        style={{
          fontSize: ".8125rem",
          fontWeight: 700,
          color: "var(--ink-700)",
          display: "block",
          marginBottom: 8,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function Auth() {
  const { nav, toast } = useBz();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [intent, setIntent] = useState<"buyer" | "seller">("buyer");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const isSeller = intent === "seller";
  const busy = loginMutation.isPending || registerMutation.isPending;

  const startGoogle = () => {
    const role = isSeller ? "seller" : "buyer";
    if (typeof window !== "undefined") {
      sessionStorage.setItem("bz_oauth_intent", role);
    }
    window.location.href = getGoogleLoginUrl(role);
  };

  const afterAuth = (user: AuthUser) => {
    nav(defaultScreenForUser(user));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      let user: AuthUser;
      if (mode === "register") {
        user = await registerMutation.mutateAsync({
          email: email.trim(),
          username: username.trim(),
          password,
          intent,
        });
      } else {
        user = await loginMutation.mutateAsync({
          login: loginId.trim(),
          password,
        });
      }
      toast(mode === "register" ? "Account created" : "Welcome back");
      afterAuth(user);
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.";
      setError(message);
    }
  };

  const canSubmit =
    password.length >= 8 &&
    (mode === "login"
      ? loginId.trim().length > 0
      : email.trim().length > 0 && username.trim().length >= 3);

  return (
    <div
      style={{ minHeight: "calc(100vh - 110px)", background: "var(--page)", padding: "24px 28px" }}
    >
      <button
        type="button"
        onClick={() => nav("splash")}
        style={{
          background: "none",
          border: "none",
          color: "var(--ink-500)",
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: ".875rem",
        }}
      >
        <Icon name="chevronLeft" size={16} /> Back
      </button>

      <div style={{ maxWidth: 420, margin: "32px auto 0", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Logo height={48} />
        </div>

        <div style={{ marginTop: 28 }}>
          {isSeller && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                background: "var(--tint-red-50)",
                border: "1.5px solid var(--red)",
                borderRadius: 999,
                marginBottom: 14,
              }}
            >
              <Icon name="store" size={14} color="var(--red)" />
              <span
                style={{
                  color: "var(--red)",
                  fontWeight: 800,
                  fontSize: ".75rem",
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                }}
              >
                Seller signup
              </span>
            </div>
          )}

          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
            {mode === "register" ? (
              isSeller ? (
                <>
                  Open your shop on <span style={{ color: "var(--red)" }}>BazaarCo</span>
                </>
              ) : (
                "Create your account"
              )
            ) : (
              "Sign in to BazaarCo"
            )}
          </h1>
          <p style={{ color: "var(--ink-500)", margin: "6px 0 0" }}>
            {mode === "register"
              ? "Email, username, and password — or continue with Google."
              : "Sign in with email or username and password."}
          </p>

          <div style={{ marginTop: 28 }}>
            <button
              type="button"
              onClick={startGoogle}
              style={{
                width: "100%",
                height: 52,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: ".9375rem",
                color: "var(--ink-900)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-11.3 8 12 12 0 1 1 7.9-21.1l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z"
                />
                <path
                  fill="#FF3D00"
                  d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12a12 12 0 0 1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44a20 20 0 0 0 13.5-5.2l-6.2-5.3A12 12 0 0 1 24 36a12 12 0 0 1-11.3-8l-6.6 5A20 20 0 0 0 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.5l6.2 5.3C37 39.3 44 34 44 24a20 20 0 0 0-.4-3.5z"
                />
              </svg>
              Continue with Google
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
            <span style={{ flex: 1, height: 1, background: "var(--line-200)" }} />
            <span
              style={{
                fontSize: ".75rem",
                color: "var(--ink-400)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: ".06em",
              }}
            >
              or
            </span>
            <span style={{ flex: 1, height: 1, background: "var(--line-200)" }} />
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "register" ? (
              <>
                <Field label="Email">
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={inputStyle}
                    required
                  />
                </Field>
                <Field label="Username">
                  <input
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                    placeholder="your_username"
                    style={inputStyle}
                    minLength={3}
                    maxLength={32}
                    required
                  />
                </Field>
              </>
            ) : (
              <Field label="Email or username">
                <input
                  type="text"
                  autoComplete="username"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="you@example.com or username"
                  style={inputStyle}
                  required
                />
              </Field>
            )}

            <Field label="Password">
              <input
                type="password"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
                style={inputStyle}
                minLength={8}
                required
              />
            </Field>

            {error && (
              <p
                style={{
                  color: "var(--red)",
                  fontSize: ".875rem",
                  margin: "0 0 12px",
                  textAlign: "left",
                }}
              >
                {error}
              </p>
            )}

            <Button variant="primary" size="lg" full disabled={!canSubmit || busy} type="submit">
              {busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--blue)",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: ".9375rem",
                fontFamily: "inherit",
              }}
            >
              {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          <div style={{ marginTop: 10 }}>
            <Button variant="ghost" full onClick={() => nav("home")}>
              Skip for now → शप गर्न जानुहोस्
            </Button>
          </div>

          <div
            style={{
              marginTop: 22,
              padding: "16px 0 0",
              borderTop: "1px dashed var(--line-200)",
              textAlign: "center",
            }}
          >
            {!isSeller ? (
              <>
                <div style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>
                  Want to sell on BazaarCo?
                </div>
                <button
                  type="button"
                  onClick={() => setIntent("seller")}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "6px 0",
                    marginTop: 2,
                    cursor: "pointer",
                    color: "var(--red)",
                    fontWeight: 800,
                    fontSize: ".9375rem",
                    textDecoration: "underline",
                    textUnderlineOffset: 4,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "inherit",
                  }}
                >
                  <Icon name="store" size={16} color="var(--red)" />
                  Become a seller · पसल खोल्नुहोस्
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>
                  Just want to shop?
                </div>
                <button
                  type="button"
                  onClick={() => setIntent("buyer")}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "6px 0",
                    marginTop: 2,
                    cursor: "pointer",
                    color: "var(--blue)",
                    fontWeight: 800,
                    fontSize: ".9375rem",
                    textDecoration: "underline",
                    textUnderlineOffset: 4,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "inherit",
                  }}
                >
                  <Icon name="cart" size={16} color="var(--blue)" />
                  Sign in as buyer instead
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
