"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useVerifyEsewaPayment } from "@/hooks/use-payment";
import { useBazaarStore } from "@/store/bazaar-store";

type Phase = "verifying" | "captured" | "pending" | "failed";

const FAILED_MESSAGE = "Payment could not be completed. Your order has not been confirmed.";

/**
 * eSewa return handler. eSewa redirects here with a base64 `data` query param;
 * we forward it to the backend, which verifies the signature + amount and the
 * eSewa status API server-side. The UI never decides success — it only reflects
 * the backend verdict. Re-running (refresh) is safe: verification is idempotent.
 */
export function EsewaCallback({ mode }: { mode: "success" | "failure" }) {
  const router = useRouter();
  const params = useSearchParams();
  const verify = useVerifyEsewaPayment();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  // eSewa returns the response in `data`; tolerate `encodedData` just in case.
  const encodedData = params.get("data") ?? params.get("encodedData");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!encodedData) {
      // Reached failure URL with no payload — nothing to verify, order unplaced.
      setPhase("failed");
      setMessage(FAILED_MESSAGE);
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
        setMessage(
          "We couldn't verify your payment. If money was deducted, it will be refunded — please contact support.",
        );
      }
    })();
  }, [encodedData, mode, router, verify]);

  return (
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
              {phase === "captured" ? "Payment confirmed" : "Verifying your eSewa payment…"}
            </div>
            <p style={{ marginTop: 10, fontSize: ".875rem", color: "var(--ink-500)" }}>
              {phase === "captured"
                ? "Taking you to your order confirmation…"
                : "Please wait — do not close this page."}
            </p>
          </>
        )}

        {phase === "pending" && (
          <>
            <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--ink-900)" }}>
              Payment is being verified
            </div>
            <p style={{ marginTop: 10, fontSize: ".875rem", color: "var(--ink-500)" }}>
              {message || "Your payment is still being confirmed. Please check again shortly."}
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
              <button type="button" onClick={() => router.refresh()} style={primaryBtn}>
                Check again
              </button>
              <button type="button" onClick={() => router.push("/orders")} style={secondaryBtn}>
                View my orders
              </button>
            </div>
          </>
        )}

        {phase === "failed" && (
          <>
            <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--danger)" }}>
              Payment not completed
            </div>
            <p style={{ marginTop: 10, fontSize: ".875rem", color: "var(--ink-500)" }}>
              {message || FAILED_MESSAGE}
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
              <button type="button" onClick={() => router.push("/checkout")} style={primaryBtn}>
                Try again
              </button>
              <button type="button" onClick={() => router.push("/cart")} style={secondaryBtn}>
                Back to cart
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  padding: "11px 18px",
  borderRadius: "var(--r-md)",
  border: "none",
  background: "var(--blue)",
  color: "#fff",
  fontWeight: 700,
  fontSize: ".875rem",
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  padding: "11px 18px",
  borderRadius: "var(--r-md)",
  border: "1px solid var(--line-200)",
  background: "#fff",
  color: "var(--ink-700)",
  fontWeight: 700,
  fontSize: ".875rem",
  cursor: "pointer",
};
