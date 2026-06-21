"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";
import { SellerIcon } from "@/seller/ui/icons";
import { useLogout, useUpdateProfile } from "@/shared/hooks/use-auth";
import { useBazaarStore } from "@/store/bazaar-store";
import { displayName, userInitial } from "@/lib/display";
import { toast } from "@/lib/toast";
import { useSellerStorefront } from "@/seller/hooks/use-seller";
import {
  useBz,
  PasswordResetModal,
  LogoutConfirmModal,
  SellerDeleteAccountModal,
} from "@/components/common";
import { SellerHelpBar, SellerPageHeader, SellerPage, Card } from "../_shared/components";

/* ---------- 4.18 Profile (includes KYC) ---------- */
export function SellerProfile() {
  const { t } = useTranslation();
  const { nav } = useBz();
  const logoutMutation = useLogout();
  const updateProfile = useUpdateProfile();
  const user = useBazaarStore((s) => s.user);
  const { data: storefront } = useSellerStorefront();
  const shopName = (storefront as { shopName?: string })?.shopName?.trim() || "Your shop";
  const ownerName = displayName(user, "Seller");

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pwdResetOpen, setPwdResetOpen] = useState(false);
  const noPassword = user?.provider === "google";
  const pwdMode = noPassword ? "set" : "reset";

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setConfirmLogout(false);
        toast.info("Logged out");
        nav("home");
      },
    });
  };

  // Owner name is the account holder's name (User.name). Editable here; the
  // store name is edited from the Storefront page instead.
  const editOwnerName = async () => {
    if (updateProfile.isPending) return;
    const next = window.prompt("Owner name", user?.name ?? "")?.trim();
    if (!next || next === user?.name) return;
    if (next.length < 2) {
      toast.error("Enter your full name");
      return;
    }
    try {
      await updateProfile.mutateAsync({ name: next });
      toast.success("Owner name updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update name");
    }
  };

  return (
    <SellerPage>
      <SellerHelpBar />
      <SellerPageHeader title={t("seller.profile.title")} subtitle={t("seller.profile.subtitle")} />

      {/* Owner card */}
      <Card style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--tint-blue-50)",
            color: "var(--blue)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: "1.5rem",
          }}
        >
          {userInitial(user)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: "1.125rem" }}>{ownerName}</div>
          <div style={{ fontSize: ".875rem", color: "var(--ink-500)" }}>
            {shopName} · {user?.email ?? "—"}
          </div>
          <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 2 }}>
            Complete KYC to get verified
          </div>
        </div>
      </Card>

      {/* My info */}
      <h2
        style={{
          margin: "10px 0 8px",
          fontSize: ".9375rem",
          fontWeight: 600,
          color: "var(--ink-900)",
        }}
      >
        My info
      </h2>
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--line-200)",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        {[
          { icon: "user", en: "Owner name", sub: ownerName, onAct: editOwnerName },
          { icon: "mail", en: "Email", sub: user?.email ?? "—", onAct: undefined },
          {
            icon: "lock",
            en: noPassword ? "Set a password" : "Reset password",
            sub: noPassword
              ? "Add a password to also sign in with email"
              : "Send a code to your email",
            onAct: () => setPwdResetOpen(true),
          },
        ].map((r, i, a) => (
          <button
            key={r.en}
            onClick={() => (r.onAct ? void r.onAct() : toast.info(`${r.en} can't be edited here`))}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 16,
              background: "#fff",
              border: "none",
              borderBottom: i < a.length - 1 ? "1px solid var(--line-200)" : "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <SellerIcon name={r.icon} size={22} color="var(--ink-700)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{r.en}</div>
              <div style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>{r.sub}</div>
            </div>
            <SellerIcon name="chevronRight" size={18} color="var(--ink-400)" />
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="secondary" full onClick={() => setConfirmLogout(true)}>
          Log out
        </Button>
      </div>
      <button
        onClick={() => setConfirmDelete(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          alignSelf: "center",
          gap: 5,
          background: "none",
          border: "none",
          padding: "4px 2px",
          cursor: "pointer",
          fontFamily: "inherit",
          fontWeight: 500,
          fontSize: ".75rem",
          color: "var(--ink-400)",
          opacity: 0.45,
          marginTop: 24,
          transition: "opacity .15s, color .15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "0.7";
          e.currentTarget.style.color = "var(--danger)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.45";
          e.currentTarget.style.color = "var(--ink-400)";
        }}
      >
        Delete my account
      </button>

      <SellerDeleteAccountModal open={confirmDelete} onClose={() => setConfirmDelete(false)} />

      <PasswordResetModal
        open={pwdResetOpen}
        onClose={() => setPwdResetOpen(false)}
        mode={pwdMode}
      />

      <LogoutConfirmModal
        open={confirmLogout}
        pending={logoutMutation.isPending}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
        skin="fluent"
      />
    </SellerPage>
  );
}
