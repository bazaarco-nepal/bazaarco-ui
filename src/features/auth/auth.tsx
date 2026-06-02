"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon, Logo, Button, AppLink } from "@/components/ui";
import { useBz } from "@/components/common";
import { resolvePostAuthScreen } from "@/lib/auth-rbac";
import { screenFromPath, pathFromScreen } from "@/config/routes";
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
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [intent, setIntent] = useState<"buyer" | "seller">("buyer");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
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
    const next = searchParams.get("next");
    const requestedScreen = next ? screenFromPath(next) : null;
    nav(resolvePostAuthScreen(user, requestedScreen));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      let user: AuthUser;
      if (mode === "register") {
        user = await registerMutation.mutateAsync({
          email: email.trim(),
          name: fullName.trim(),
          password,
          intent,
        });
      } else {
        user = await loginMutation.mutateAsync({
          email: loginEmail.trim(),
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
      ? loginEmail.trim().length > 0
      : email.trim().length > 0 && fullName.trim().length >= 2);

  return (
    <div
      style={{ minHeight: "calc(100vh - 110px)", background: "var(--page)", padding: "24px 28px" }}
    >
      <AppLink
        href={pathFromScreen("home")}
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
          textDecoration: "none",
        }}
      >
        <Icon name="chevronLeft" size={16} /> Back
      </AppLink>

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
              ? "Your name, email, and password — or continue with Google."
              : "Sign in with email and password — or continue with Google."}
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
                <Field label="Full name">
                  <input
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sita Sharma"
                    style={inputStyle}
                    minLength={2}
                    maxLength={255}
                    required
                  />
                </Field>
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
              </>
            ) : (
              <Field label="Email">
                <input
                  type="email"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
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
            <Button variant="ghost" full href={pathFromScreen("home")}>
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
