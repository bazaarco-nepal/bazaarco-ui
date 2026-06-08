"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon, Logo, Button, AppLink, PasswordInput } from "@/components/ui";
import { useBz } from "@/components/common";
import { resolvePostAuthScreen } from "@/lib/auth-rbac";
import { screenFromPath, pathFromScreen } from "@/config/routes";
import {
  useForgotPasswordConfirm,
  useForgotPasswordRequest,
  useLogin,
  useRegister,
  useResendEmailVerification,
  useVerifyEmail,
} from "@/hooks/use-auth";
import { getGoogleLoginUrl } from "@/services/api/auth";
import { ApiRequestError } from "@/services/api/http";
import type { AuthUser, PendingEmailVerification } from "@/types/auth";
import { isStrongPassword, passwordRequirementMessage } from "@/lib/password-validation";

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 46,
  border: "1.5px solid var(--line-200)",
  borderRadius: "var(--r-md)",
  padding: "0 16px",
  fontSize: "1rem",
  fontFamily: "var(--font-sans)",
  outline: "none",
  background: "#fff",
  color: "var(--ink-900)",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (value: string) => emailPattern.test(value.trim());

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 10, textAlign: "left" }}>
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
      {error && (
        <p
          style={{
            color: "var(--red)",
            fontSize: ".8125rem",
            fontWeight: 600,
            margin: "6px 0 0",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function Auth() {
  const { nav, toast } = useBz();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [intent, setIntent] = useState<"buyer" | "seller">("buyer");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState<PendingEmailVerification | null>(
    null,
  );
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Legal acceptance state
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [acceptedMarketing, setAcceptedMarketing] = useState(false);

  // Forgot password state
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMaskedEmail, setForgotMaskedEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState<string | null>(null);

  const forgotRequestMutation = useForgotPasswordRequest();
  const forgotConfirmMutation = useForgotPasswordConfirm();

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const verifyEmailMutation = useVerifyEmail();
  const resendVerificationMutation = useResendEmailVerification();
  const isSeller = intent === "seller";
  const activeEmail = mode === "login" ? loginEmail : email;
  const activeEmailTrimmed = activeEmail.trim();
  const emailFormatError =
    activeEmailTrimmed.length > 0 && !isValidEmail(activeEmailTrimmed)
      ? "Enter a valid email address."
      : null;
  const passwordFormatError =
    mode === "register" && password.length > 0 && !isStrongPassword(password)
      ? passwordRequirementMessage
      : null;
  const forgotBusy = forgotRequestMutation.isPending || forgotConfirmMutation.isPending;
  const busy =
    loginMutation.isPending ||
    registerMutation.isPending ||
    verifyEmailMutation.isPending ||
    resendVerificationMutation.isPending;

  const startGoogle = () => {
    const role = isSeller ? "seller" : "buyer";
    if (typeof window !== "undefined") {
      sessionStorage.setItem("bz_oauth_intent", role);
      // Preserve the return-to target across the OAuth redirect, since the
      // `?next=` query param won't survive the round-trip to Google.
      const next = searchParams.get("next");
      if (next) {
        sessionStorage.setItem("bz_oauth_next", next);
      } else {
        sessionStorage.removeItem("bz_oauth_next");
      }
    }
    window.location.href = getGoogleLoginUrl(role);
  };

  const afterAuth = (user: AuthUser) => {
    const next = searchParams.get("next");
    const requestedScreen = next ? screenFromPath(next) : null;
    const resolved = resolvePostAuthScreen(user, requestedScreen);
    // When the user is allowed to land on exactly where they came from, push the
    // original path verbatim so product ids and browse filters are preserved.
    // Otherwise fall back to the role-resolved default screen.
    if (next && requestedScreen && resolved === requestedScreen) {
      router.push(next);
      if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    } else {
      nav(resolved);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (emailFormatError || passwordFormatError) {
      return;
    }

    try {
      let user: AuthUser;
      if (mode === "register") {
        const pending = await registerMutation.mutateAsync({
          email: email.trim(),
          name: fullName.trim(),
          password,
          intent,
          acceptances: [
            { slug: 'age-verification', version: '1.0' },
            { slug: 'terms-and-conditions', version: '1.0' },
            { slug: 'privacy-policy', version: '1.0' },
            ...(acceptedMarketing ? [{ slug: 'cookie-tracking-notice', version: '1.0' }] : []),
          ],
        });
        setPendingVerification(pending);
        setOtp("");
        toast("Verification code sent");
        return;
      } else {
        user = await loginMutation.mutateAsync({
          email: loginEmail.trim(),
          password,
        });
      }
      toast("Welcome back");
      afterAuth(user);
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.";
      if (mode === "login" && err instanceof ApiRequestError && err.status === 403) {
        setPendingVerification({
          email: loginEmail.trim(),
          intent,
          verificationRequired: true,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        });
        setOtp("");
      }
      setError(message);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingVerification) return;
    setError(null);

    try {
      const user = await verifyEmailMutation.mutateAsync({
        email: pendingVerification.email,
        otp: otp.trim(),
      });
      toast("Email verified");
      afterAuth(user);
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.";
      setError(message);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingVerification) return;
    setError(null);
    try {
      const pending = await resendVerificationMutation.mutateAsync({
        email: pendingVerification.email,
      });
      setPendingVerification(pending);
      setOtp("");
      toast("Verification code resent");
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.";
      setError(message);
    }
  };

  const canSubmit =
    isValidEmail(activeEmailTrimmed) &&
    (mode === "login"
      ? loginEmail.trim().length > 0 && password.length > 0
      : email.trim().length > 0 &&
        fullName.trim().length >= 2 &&
        isStrongPassword(password) &&
        acceptedLegal);
  const canVerify = /^\d{6}$/.test(otp.trim());

  const openForgotPassword = () => {
    setForgotMode(true);
    setForgotStep(1);
    setForgotEmail(loginEmail);
    setForgotOtp("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotError(null);
    setForgotMaskedEmail("");
    setError(null);
  };

  const handleForgotSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    const trimmed = forgotEmail.trim();
    if (!isValidEmail(trimmed)) {
      setForgotError("Enter a valid email address.");
      return;
    }
    try {
      const res = await forgotRequestMutation.mutateAsync({ email: trimmed });
      setForgotMaskedEmail(res.email);
      setForgotStep(2);
      toast("Reset code sent to your email");
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : "Could not send reset code");
    }
  };

  const handleForgotConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (!/^\d{6}$/.test(forgotOtp.trim())) {
      setForgotError("Enter the 6-digit code");
      return;
    }
    if (!isStrongPassword(forgotNewPassword)) {
      setForgotError(passwordRequirementMessage);
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("Passwords do not match");
      return;
    }

    try {
      await forgotConfirmMutation.mutateAsync({
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword,
      });
      toast("Password updated — please sign in");
      setForgotMode(false);
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : "Could not reset password");
    }
  };

  return (
    <div
      className="bz-container-pad"
      style={{
        minHeight: "calc(100vh - 110px)",
        background: "var(--page)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 28px 24px",
      }}
    >
      <div>
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
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 8,
        }}
      >
        <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Logo height={48} />
          </div>

          {!pendingVerification && !forgotMode && (
            <div
              style={{
                display: "flex",
                marginTop: 18,
                background: "var(--line-100, #f1f3f5)",
                borderRadius: "var(--r-md)",
                padding: 4,
                gap: 4,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIntent("buyer");
                  setError(null);
                }}
                style={{
                  flex: 1,
                  height: 42,
                  border: "none",
                  borderRadius: "calc(var(--r-md) - 2px)",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: ".875rem",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "background .15s, color .15s, box-shadow .15s",
                  background: !isSeller ? "#fff" : "transparent",
                  color: !isSeller ? "var(--blue-deep)" : "var(--ink-500)",
                  boxShadow: !isSeller ? "0 1px 4px rgba(0,0,0,.10)" : "none",
                }}
              >
                <Icon name="cart" size={16} color={!isSeller ? "var(--blue)" : "var(--ink-400)"} />
                Shop
              </button>
              <button
                type="button"
                onClick={() => {
                  setIntent("seller");
                  setMode("register");
                  setError(null);
                }}
                style={{
                  flex: 1,
                  height: 42,
                  border: "none",
                  borderRadius: "calc(var(--r-md) - 2px)",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: ".875rem",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "background .15s, color .15s, box-shadow .15s",
                  background: isSeller ? "#fff" : "transparent",
                  color: isSeller ? "var(--red)" : "var(--ink-500)",
                  boxShadow: isSeller ? "0 1px 4px rgba(0,0,0,.10)" : "none",
                }}
              >
                <Icon name="store" size={16} color={isSeller ? "var(--red)" : "var(--ink-400)"} />
                Sell on BazaarCo
              </button>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <h1
              style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}
            >
              {forgotMode ? (
                "Reset your password"
              ) : pendingVerification ? (
                "Verify your email"
              ) : mode === "register" ? (
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
              {forgotMode
                ? forgotStep === 1
                  ? "Enter the email address you signed up with. We'll send a code to reset your password."
                  : ""
                : pendingVerification
                  ? `Enter the 6-digit code sent to ${pendingVerification.email}.`
                  : mode === "register"
                    ? "Your name, email, and password — or continue with Google."
                    : "Sign in with email and password — or continue with Google."}
            </p>

            {!pendingVerification && !forgotMode && (
              <div style={{ marginTop: 18 }}>
                <button
                  type="button"
                  onClick={startGoogle}
                  style={{
                    width: "100%",
                    height: 46,
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
            )}

            {!pendingVerification && !forgotMode && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 0" }}>
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
            )}

            {forgotMode ? (
              forgotStep === 1 ? (
                <form onSubmit={handleForgotSendCode}>
                  <Field
                    label="Email address"
                    error={
                      forgotEmail.trim().length > 0 && !isValidEmail(forgotEmail.trim())
                        ? "Enter a valid email address."
                        : null
                    }
                  >
                    <input
                      type="email"
                      autoComplete="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={inputStyle}
                      required
                    />
                  </Field>

                  {forgotError && (
                    <p
                      style={{
                        color: "var(--red)",
                        fontSize: ".875rem",
                        margin: "0 0 12px",
                        textAlign: "left",
                      }}
                    >
                      {forgotError}
                    </p>
                  )}

                  <Button
                    variant="primary"
                    size="lg"
                    full
                    disabled={!isValidEmail(forgotEmail.trim()) || forgotBusy}
                    type="submit"
                  >
                    {forgotBusy ? "Please wait…" : "Send reset code"}
                  </Button>

                  <div style={{ marginTop: 14, textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => setForgotMode(false)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--blue)",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: ".875rem",
                        fontFamily: "inherit",
                      }}
                    >
                      Back to sign in
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleForgotConfirm}>
                  <p
                    style={{
                      margin: "0 0 16px",
                      color: "var(--ink-500)",
                      fontSize: ".9375rem",
                      lineHeight: 1.55,
                      textAlign: "left",
                    }}
                  >
                    Enter the code sent to{" "}
                    <b style={{ color: "var(--ink-700)" }}>{forgotMaskedEmail}</b> and choose a new
                    password.
                  </p>

                  <Field label="Verification code">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      style={{
                        ...inputStyle,
                        textAlign: "center",
                        fontSize: "1.25rem",
                        fontWeight: 800,
                        letterSpacing: ".24em",
                      }}
                      minLength={6}
                      maxLength={6}
                      required
                    />
                  </Field>

                  <Field
                    label="New password"
                    error={
                      forgotNewPassword.length > 0 && !isStrongPassword(forgotNewPassword)
                        ? passwordRequirementMessage
                        : null
                    }
                  >
                    <PasswordInput
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="8+ characters, number, symbol"
                      autoComplete="new-password"
                      inputStyle={{
                        ...inputStyle,
                        border:
                          forgotNewPassword.length > 0 && !isStrongPassword(forgotNewPassword)
                            ? "1.5px solid var(--red)"
                            : "1.5px solid var(--line-200)",
                      }}
                    />
                  </Field>

                  <Field
                    label="Confirm new password"
                    error={
                      forgotConfirmPassword.length > 0 &&
                      forgotConfirmPassword !== forgotNewPassword
                        ? "Passwords do not match"
                        : null
                    }
                  >
                    <PasswordInput
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      inputStyle={{
                        ...inputStyle,
                        border:
                          forgotConfirmPassword.length > 0 &&
                          forgotConfirmPassword !== forgotNewPassword
                            ? "1.5px solid var(--red)"
                            : "1.5px solid var(--line-200)",
                      }}
                    />
                  </Field>

                  {forgotError && (
                    <p
                      style={{
                        color: "var(--red)",
                        fontSize: ".875rem",
                        margin: "0 0 12px",
                        textAlign: "left",
                      }}
                    >
                      {forgotError}
                    </p>
                  )}

                  <Button variant="primary" size="lg" full disabled={forgotBusy} type="submit">
                    {forgotBusy ? "Please wait…" : "Update password"}
                  </Button>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 12,
                      marginTop: 14,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep(1);
                        setForgotOtp("");
                        setForgotNewPassword("");
                        setForgotConfirmPassword("");
                        setForgotError(null);
                      }}
                      disabled={forgotBusy}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--ink-500)",
                        fontWeight: 700,
                        cursor: forgotBusy ? "not-allowed" : "pointer",
                        fontSize: ".875rem",
                        fontFamily: "inherit",
                      }}
                    >
                      Change email
                    </button>
                    <button
                      type="button"
                      onClick={() => setForgotMode(false)}
                      disabled={forgotBusy}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--blue)",
                        fontWeight: 700,
                        cursor: forgotBusy ? "not-allowed" : "pointer",
                        fontSize: ".875rem",
                        fontFamily: "inherit",
                      }}
                    >
                      Back to sign in
                    </button>
                  </div>
                </form>
              )
            ) : pendingVerification ? (
              <form onSubmit={handleVerifyEmail}>
                <Field label="Verification code">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    style={{
                      ...inputStyle,
                      textAlign: "center",
                      fontSize: "1.25rem",
                      fontWeight: 800,
                      letterSpacing: ".24em",
                    }}
                    minLength={6}
                    maxLength={6}
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

                <Button
                  variant="primary"
                  size="lg"
                  full
                  disabled={!canVerify || busy}
                  type="submit"
                >
                  {busy ? "Please wait…" : "Verify email"}
                </Button>

                <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={busy}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--blue)",
                      fontWeight: 700,
                      cursor: busy ? "not-allowed" : "pointer",
                      fontSize: ".875rem",
                      fontFamily: "inherit",
                    }}
                  >
                    Resend code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingVerification(null);
                      setOtp("");
                      setError(null);
                    }}
                    disabled={busy}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--ink-500)",
                      fontWeight: 700,
                      cursor: busy ? "not-allowed" : "pointer",
                      fontSize: ".875rem",
                      fontFamily: "inherit",
                    }}
                  >
                    Change email
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit}>
                {mode === "register" ? (
                  <>
                    <Field label="Full name">
                      <input
                        type="text"
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Sampada Poudel"
                        style={inputStyle}
                        minLength={2}
                        maxLength={255}
                        required
                      />
                    </Field>
                    <Field label="Email" error={mode === "register" ? emailFormatError : null}>
                      <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        style={{
                          ...inputStyle,
                          border:
                            mode === "register" && emailFormatError
                              ? "1.5px solid var(--red)"
                              : "1.5px solid var(--line-200)",
                        }}
                        required
                      />
                    </Field>
                  </>
                ) : (
                  <Field label="Email" error={mode === "login" ? emailFormatError : null}>
                    <input
                      type="email"
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={{
                        ...inputStyle,
                        border:
                          mode === "login" && emailFormatError
                            ? "1.5px solid var(--red)"
                            : "1.5px solid var(--line-200)",
                      }}
                      required
                    />
                  </Field>
                )}

                <Field label="Password" error={passwordFormatError}>
                  <PasswordInput
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      mode === "register" ? "8+ characters, number, symbol" : "Your password"
                    }
                    inputStyle={{
                      ...inputStyle,
                      border: passwordFormatError
                        ? "1.5px solid var(--red)"
                        : "1.5px solid var(--line-200)",
                    }}
                    minLength={8}
                    required
                  />
                </Field>

                {mode === "register" && (
                  <div style={{ marginBottom: 16, marginTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 16 }}>
                      <input
                        type="checkbox"
                        id="acceptedLegal"
                        checked={acceptedLegal}
                        onChange={(e) => setAcceptedLegal(e.target.checked)}
                        style={{
                          marginTop: 4,
                          width: 18,
                          height: 18,
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                        required
                      />
                      <label
                        htmlFor="acceptedLegal"
                        style={{
                          fontSize: ".875rem",
                          color: "var(--ink-700)",
                          cursor: "pointer",
                          lineHeight: 1.4,
                        }}
                      >
                        I'm 18 or older and agree to the{" "}
                        <a
                          href="/legal/terms-and-conditions"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "var(--blue)",
                            textDecoration: "none",
                            fontWeight: 600,
                          }}
                        >
                          Terms & Conditions
                        </a>
                        {" "}and{" "}
                        <a
                          href="/legal/privacy-policy"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "var(--blue)",
                            textDecoration: "none",
                            fontWeight: 600,
                          }}
                        >
                          Privacy Policy
                        </a>
                      </label>
                    </div>

                    <div style={{ borderTop: "1px solid var(--line-200)", paddingTop: 12 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <input
                          type="checkbox"
                          id="acceptedMarketing"
                          checked={acceptedMarketing}
                          onChange={(e) => setAcceptedMarketing(e.target.checked)}
                          style={{
                            marginTop: 4,
                            width: 18,
                            height: 18,
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        />
                        <label
                          htmlFor="acceptedMarketing"
                          style={{
                            fontSize: ".875rem",
                            color: "var(--ink-500)",
                            cursor: "pointer",
                            lineHeight: 1.4,
                          }}
                        >
                          Send me offers and updates
                          <span style={{ color: "var(--ink-400)", fontSize: ".8125rem", marginLeft: 4 }}>
                            (optional)
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {mode === "login" && (
                  <div style={{ textAlign: "right", marginBottom: 12, marginTop: -4 }}>
                    <button
                      type="button"
                      onClick={openForgotPassword}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--blue)",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: ".8125rem",
                        fontFamily: "inherit",
                        padding: 0,
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

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

                <Button
                  variant="primary"
                  size="lg"
                  full
                  disabled={!canSubmit || busy}
                  type="submit"
                >
                  {busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}
                </Button>
              </form>
            )}

            {!pendingVerification && !forgotMode && (
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login");
                    setPendingVerification(null);
                    setOtp("");
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
                  {mode === "login"
                    ? "Need an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            )}

            {!pendingVerification && !forgotMode && !isSeller && (
              <div style={{ marginTop: 10 }}>
                <Button variant="ghost" full href={pathFromScreen("home")}>
                  Skip for now
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
