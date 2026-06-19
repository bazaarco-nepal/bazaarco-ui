"use client";

import { useEffect, useRef } from "react";
import type { EsewaFormFields } from "@/services/api/orders";

/**
 * Auto-submitting hidden form that hands the buyer off to eSewa. The fields are
 * generated and signed server-side — this component never computes a signature
 * or touches the secret; it only POSTs what the backend returned. A visible
 * "Continue to eSewa" button is the fallback if the auto-submit is blocked.
 */
export function EsewaRedirectForm({
  paymentUrl,
  fields,
}: {
  paymentUrl: string;
  fields: EsewaFormFields;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.submit();
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(255,255,255,0.96)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--ink-900)" }}>
        Redirecting to eSewa…
      </div>
      <p style={{ fontSize: ".875rem", color: "var(--ink-500)", maxWidth: 360, margin: 0 }}>
        Please wait while we take you to eSewa to complete your payment securely.
      </p>

      <form ref={formRef} method="POST" action={paymentUrl}>
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <button
          type="submit"
          style={{
            marginTop: 4,
            padding: "12px 20px",
            borderRadius: "var(--r-md)",
            border: "none",
            background: "var(--blue)",
            color: "#fff",
            fontWeight: 700,
            fontSize: ".9375rem",
            cursor: "pointer",
          }}
        >
          Continue to eSewa
        </button>
      </form>
    </div>
  );
}
