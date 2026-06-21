"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { useBz } from "@/components/common";
import { Spinner } from "@/components/ui";
import { screenFromPath } from "@/config/routes";
import { resolvePostAuthScreen } from "@/shared/lib/auth-rbac";
import { setAccessToken } from "@/shared/lib/auth-token";
import { toast } from "@/shared/lib/toast";
import { establishBrowserSession, fetchCurrentUser } from "@/shared/api/auth";
import { useBazaarStore } from "@/store/bazaar-store";

export function AuthCallback() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { nav } = useBz();
  const setAuthed = useBazaarStore((s) => s.setAuthed);
  const setUser = useBazaarStore((s) => s.setUser);
  const [message, setMessage] = useState(t("auth.signingIn"));

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setMessage(t("auth.signInFailed"));
      toast.error(decodeURIComponent(error));
      nav("auth");
      return;
    }

    if (searchParams.get("success") !== "1") {
      nav("auth");
      return;
    }

    const sessionToken = searchParams.get("session_token");

    let cancelled = false;

    (async () => {
      try {
        if (sessionToken) {
          setAccessToken(sessionToken);
          try {
            await establishBrowserSession(sessionToken);
          } catch {
            // Storefront cookie may fail cross-origin; Bearer in localStorage still works.
          }
          if (typeof window !== "undefined") {
            const clean = new URL(window.location.href);
            clean.searchParams.delete("session_token");
            window.history.replaceState({}, "", clean.pathname + clean.search);
          }
        }

        let user = await fetchCurrentUser();
        if (cancelled) return;

        const urlIntent = searchParams.get("intent");
        const storedIntent =
          typeof window !== "undefined" ? sessionStorage.getItem("bz_oauth_intent") : null;
        if (storedIntent === "seller" || urlIntent === "seller") {
          user = { ...user, intent: "seller" };
        }
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("bz_oauth_intent");
        }

        setAuthed(true);
        setUser(user);
        // Prefer the return-to path stashed before the OAuth redirect; fall back
        // to the `?next=` query if the provider echoed it back.
        const storedNext =
          typeof window !== "undefined" ? sessionStorage.getItem("bz_oauth_next") : null;
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("bz_oauth_next");
        }
        const nextPath = storedNext || searchParams.get("next");
        const requestedScreen = nextPath ? screenFromPath(nextPath) : null;
        const resolved = resolvePostAuthScreen(user, requestedScreen);
        if (nextPath && requestedScreen && resolved === requestedScreen) {
          router.push(nextPath);
          if (typeof window !== "undefined") window.scrollTo({ top: 0 });
        } else {
          nav(resolved);
        }
      } catch {
        if (cancelled) return;
        setMessage(t("auth.sessionLoadFailed"));
        toast.error(t("auth.signInFailedRetry"));
        nav("auth");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nav, router, searchParams, setAuthed, setUser, t]);

  return (
    <div
      style={{
        minHeight: "calc(100vh - 110px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: "var(--page)",
      }}
    >
      <Spinner />
      <p style={{ color: "var(--ink-500)", fontWeight: 600 }}>{message}</p>
    </div>
  );
}
