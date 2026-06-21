"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useVerifyEsewaPayment } from "@/buyer/hooks/use-payment";
import { useBazaarStore } from "@/store/bazaar-store";
import { Button, BuyerPack } from "@/components/ui";

type Phase = "verifying" | "captured" | "pending" | "failed";

/**
 * eSewa return handler. eSewa redirects here with a base64 `data` query param;
 * we forward it to the backend, which verifies the signature + amount and the
 * eSewa status API server-side. The UI never decides success — it only reflects
 * the backend verdict. Re-running (refresh) is safe: verification is idempotent.
 */
export function EsewaCallback({ mode }: { mode: "success" | "failure" }) {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const verify = useVerifyEsewaPayment();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  const failedMessage = t("payment.callback.failedMessage");

  // eSewa returns the response in `data`; tolerate `encodedData` just in case.
  const encodedData = params.get("data") ?? params.get("encodedData");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!encodedData) {
      // Reached failure URL with no payload — nothing to verify, order unplaced.
      setPhase("failed");
      setMessage(failedMessage);
      return;
    }

    void (async () => {
      try {
        const result = await verify.mutateAsync({ encodedData, source: mode });
        setMessage(result.message);
        if (result.status === "captured") {
          setPhase("captured");
          // Hand off to the existing order-confirmed screen.
          useBazaarStore.getState().setLastOrderId(result.orderId);
          router.replace("/checkout/success");
        } else if (result.status === "pending" || result.status === "ambiguous") {
          setPhase("pending");
        } else {
          setPhase("failed");
        }
      } catch {
        setPhase("failed");
        setMessage(t("payment.callback.verifyError"));
      }
    })();
  }, [encodedData, mode, router, verify, failedMessage, t]);

  return (
    <BuyerPack>
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 440,
            width: "100%",
            background: "#fff",
            border: "1px solid var(--line-200)",
            borderRadius: "var(--r-lg)",
            padding: 32,
            textAlign: "center",
          }}
        >
          {(phase === "verifying" || phase === "captured") && (
            <>
              <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--ink-900)" }}>
                {phase === "captured"
                  ? t("payment.callback.confirmedTitle")
                  : t("payment.callback.verifyingTitle")}
              </div>
              <p style={{ marginTop: 10, fontSize: ".875rem", color: "var(--ink-500)" }}>
                {phase === "captured"
                  ? t("payment.callback.confirmedHint")
                  : t("payment.callback.verifyingHint")}
              </p>
            </>
          )}

          {phase === "pending" && (
            <>
              <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--ink-900)" }}>
                {t("payment.callback.pendingTitle")}
              </div>
              <p style={{ marginTop: 10, fontSize: ".875rem", color: "var(--ink-500)" }}>
                {message || t("payment.callback.pendingHint")}
              </p>
              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  gap: 10,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button variant="primary" onClick={() => router.refresh()}>
                  {t("payment.callback.checkAgain")}
                </Button>
                <Button variant="secondary" onClick={() => router.push("/orders")}>
                  {t("payment.callback.viewOrders")}
                </Button>
              </div>
            </>
          )}

          {phase === "failed" && (
            <>
              <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--danger)" }}>
                {t("payment.callback.failedTitle")}
              </div>
              <p style={{ marginTop: 10, fontSize: ".875rem", color: "var(--ink-500)" }}>
                {message || failedMessage}
              </p>
              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  gap: 10,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button variant="primary" onClick={() => router.push("/checkout")}>
                  {t("payment.callback.tryAgain")}
                </Button>
                <Button variant="secondary" onClick={() => router.push("/cart")}>
                  {t("payment.callback.backToCart")}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </BuyerPack>
  );
}
