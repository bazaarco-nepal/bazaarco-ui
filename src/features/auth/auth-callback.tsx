"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useBz } from "@/components/common";
import { Spinner } from "@/components/ui";
import { resolvePostAuthScreen } from "@/lib/auth-rbac";
import { fetchCurrentUser } from "@/services/api/auth";
import { useBazaarStore } from "@/store/bazaar-store";

export function AuthCallback() {
  const searchParams = useSearchParams();
  const { nav, toast } = useBz();
  const setAuthed = useBazaarStore((s) => s.setAuthed);
  const setUser = useBazaarStore((s) => s.setUser);
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setMessage("Sign-in failed");
      toast(decodeURIComponent(error));
      nav("auth");
      return;
    }

    if (searchParams.get("success") !== "1") {
      nav("auth");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
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
        const next = resolvePostAuthScreen(user, searchParams.get("next"));
        nav(next);
      } catch {
        if (cancelled) return;
        setMessage("Could not load your session");
        toast("Sign-in failed. Please try again.");
        nav("auth");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nav, searchParams, setAuthed, setUser, toast]);

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
