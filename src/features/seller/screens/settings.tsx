"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button, ApiState } from "@/components/ui";
import { SellerIcon } from "@/seller/ui/icons";
import { useBazaarStore } from "@/store/bazaar-store";
import {
  useSellerNotifications,
  useSellerSettings,
  useUpdateSellerSettings,
  useSellerOrganization,
} from "@/hooks/use-seller";
import {
  useBz,
  PasswordResetModal,
  SellerDeleteAccountModal,
  LanguageToggle,
} from "@/components/common";
import { SellerHelpBar, SellerPageHeader } from "../_shared/components";
import { NOTIF_CHANNELS, NOTIF_EVENTS } from "../_shared/notif";
import { toast } from "@/lib/toast";

export function SellerSettings() {
  const { t } = useTranslation();
  const { nav } = useBz();
  const user = useBazaarStore((s) => s.user);
  const { data: organization } = useSellerOrganization();
  // Account settings (password, email, language, delete) work without KYC, so the
  // page stays open for sellers who deferred onboarding. Only the alert matrix —
  // which needs an active store — is hidden until the org is linked.
  const orgLinked = organization?.linked === true;
  const { data: notifications } = useSellerNotifications();
  const { data: settings, isLoading, isError, error } = useSellerSettings(orgLinked);
  const updateSettings = useUpdateSellerSettings();
  const [tab, setTab] = useState("account");
  const [notif, setNotif] = useState<boolean[][] | null>(null);
  const [pwdResetOpen, setPwdResetOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const noPassword = user?.provider === "google";
  const pwdMode = noPassword ? "set" : "reset";

  useEffect(() => {
    if (!settings) return;
    setNotif(settings.alertMatrix.map((row) => [...row]));
  }, [settings]);

  const handleSave = async () => {
    if (!notif) return;
    try {
      await updateSettings.mutateAsync({
        alertMatrix: notif,
      });
      toast.success(t("seller.common.settingsSaved"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("seller.common.settingsSaveFailed"));
    }
  };

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div className="bz-seller-page">
        <SellerHelpBar />
        <SellerPageHeader
          title={t("seller.settings.title")}
          subtitle={t("seller.settings.subtitle")}
        />
        {/* Tab bar — same underline pattern as PDP description/specs */}
        <div
          role="tablist"
          style={{
            display: "flex",
            gap: 0,
            borderBottom: "2px solid var(--line-200)",
            marginBottom: 20,
            marginTop: 8,
          }}
        >
          {[
            { id: "account", labelKey: "seller.settings.tabAccount", soon: false },
            // Alerts is being rebuilt — show the tab so sellers know it's coming,
            // but keep it disabled (not clickable) until the feature ships.
            ...(orgLinked
              ? [{ id: "alerts", labelKey: "seller.settings.tabAlerts", soon: true }]
              : []),
          ].map((tabDef) => {
            const active = tab === tabDef.id;
            return (
              <button
                key={tabDef.id}
                role="tab"
                aria-selected={active}
                aria-disabled={tabDef.soon}
                disabled={tabDef.soon}
                onClick={tabDef.soon ? undefined : () => setTab(tabDef.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "none",
                  border: "none",
                  borderBottom: `2px solid ${active ? "var(--blue)" : "transparent"}`,
                  marginBottom: -2,
                  padding: "12px 18px",
                  cursor: tabDef.soon ? "not-allowed" : "pointer",
                  fontWeight: active ? 600 : 500,
                  fontSize: ".9375rem",
                  color: tabDef.soon ? "var(--ink-300)" : active ? "var(--blue)" : "var(--ink-500)",
                  fontFamily: "var(--font-sans)",
                  transition:
                    "color var(--dur-standard) var(--ease), border-color var(--dur-standard) var(--ease)",
                }}
              >
                {t(tabDef.labelKey)}
                {tabDef.soon && (
                  <span
                    style={{
                      fontSize: ".625rem",
                      fontWeight: 600,
                      letterSpacing: ".04em",
                      textTransform: "uppercase",
                      color: "var(--ink-400)",
                      background: "var(--line-100)",
                      border: "1px solid var(--line-200)",
                      borderRadius: 999,
                      padding: "2px 7px",
                    }}
                  >
                    {t("common.comingSoon")}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {tab === "alerts" && notif && (
          <div>
            <p style={{ margin: "0 0 12px", fontSize: ".875rem", color: "var(--ink-500)" }}>
              {t("seller.settings.alertsHint")}
            </p>
            {(notifications?.items ?? []).length > 0 && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--line-200)",
                  borderRadius: "var(--r-lg)",
                  padding: 14,
                  marginBottom: 14,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: ".875rem", marginBottom: 10 }}>
                  {t("seller.settings.recentAlerts")}
                </div>
                {(notifications?.items ?? []).map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: "8px 0",
                      borderBottom: "1px solid var(--line-200)",
                      fontSize: ".8125rem",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{n.title}</div>
                    <div style={{ color: "var(--ink-500)" }}>
                      {n.body} · {n.time}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                overflow: "auto",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
                <thead>
                  <tr style={{ background: "var(--line-100)" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px 16px",
                        fontSize: ".7rem",
                        fontWeight: 600,
                        color: "var(--ink-500)",
                        letterSpacing: ".06em",
                        textTransform: "uppercase",
                      }}
                    >
                      {t("seller.settings.tellMeAbout")}
                    </th>
                    {NOTIF_CHANNELS.map((c) => (
                      <th
                        key={c.id}
                        style={{
                          padding: "12px 12px",
                          fontSize: ".7rem",
                          fontWeight: 600,
                          color: "var(--ink-500)",
                          letterSpacing: ".06em",
                          textTransform: "uppercase",
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <SellerIcon name={c.icon} size={14} /> {t(c.labelKey)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {NOTIF_EVENTS.map((e, ri) => (
                    <tr key={e.id} style={{ borderTop: "1px solid var(--line-200)" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600 }}>{t(e.labelKey)}</div>
                      </td>
                      {NOTIF_CHANNELS.map((_, ci) => (
                        <td key={ci} style={{ padding: "14px 12px", textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={notif[ri]?.[ci] ?? false}
                            disabled={ri === 0 && ci === 0}
                            onChange={() =>
                              setNotif((s) =>
                                s
                                  ? s.map((row, i) =>
                                      i === ri ? row.map((v, j) => (j === ci ? !v : v)) : row,
                                    )
                                  : s,
                              )
                            }
                            style={{
                              width: 20,
                              height: 20,
                              accentColor: "var(--blue)",
                              cursor: ri === 0 && ci === 0 ? "not-allowed" : "pointer",
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "account" && (
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              overflow: "hidden",
            }}
          >
            {[
              {
                id: "password",
                icon: "lock",
                title: noPassword
                  ? t("seller.settings.setPassword")
                  : t("seller.settings.resetPassword"),
                sub: noPassword
                  ? t("seller.settings.setPasswordSub")
                  : t("seller.settings.resetPasswordSub"),
                onAct: () => setPwdResetOpen(true),
                control: undefined,
              },
              {
                id: "email",
                icon: "mail",
                title: t("seller.settings.email"),
                sub: user?.email ?? "—",
                onAct: undefined,
                control: undefined,
              },
              {
                id: "language",
                icon: "globe",
                title: t("seller.language"),
                sub: t("seller.languageSub"),
                onAct: undefined,
                control: <LanguageToggle compact />,
              },
            ].map((r, i, a) => {
              const content = (
                <>
                  <SellerIcon name={r.icon} size={22} color="var(--ink-700)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{r.title}</div>
                    <div style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>{r.sub}</div>
                  </div>
                  {r.control
                    ? r.control
                    : r.onAct && (
                        <SellerIcon name="chevronRight" size={18} color="var(--ink-400)" />
                      )}
                </>
              );
              const rowStyle: React.CSSProperties = {
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 16,
                background: "#fff",
                borderBottom: i < a.length - 1 ? "1px solid var(--line-200)" : "none",
              };
              return r.onAct ? (
                <button
                  key={r.id}
                  onClick={() => r.onAct?.()}
                  className="bz-hover-tint"
                  style={{ ...rowStyle, border: "none", cursor: "pointer", textAlign: "left" }}
                >
                  {content}
                </button>
              ) : (
                <div key={r.id} style={rowStyle}>
                  {content}
                </div>
              );
            })}
          </div>
        )}

        {tab === "account" && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                alignSelf: "center",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "none",
                border: "none",
                padding: "4px 2px",
                marginTop: 14,
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 500,
                fontSize: ".75rem",
                color: "var(--ink-400)",
                opacity: 0.55,
                transition: "opacity .15s, color .15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.85";
                e.currentTarget.style.color = "var(--danger)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "0.55";
                e.currentTarget.style.color = "var(--ink-400)";
              }}
            >
              {t("seller.common.deleteAccount")}
            </button>
          </div>
        )}

        {tab === "alerts" && (
          <Button
            variant="primary"
            size="md"
            full
            disabled={!notif || updateSettings.isPending}
            onClick={() => void handleSave()}
            style={{ marginTop: 18 }}
          >
            {updateSettings.isPending ? t("seller.common.saving") : t("seller.common.save")}
          </Button>
        )}

        <PasswordResetModal
          open={pwdResetOpen}
          onClose={() => setPwdResetOpen(false)}
          mode={pwdMode}
        />

        <SellerDeleteAccountModal open={confirmDelete} onClose={() => setConfirmDelete(false)} />
      </div>
    </ApiState>
  );
}
