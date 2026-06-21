"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button, BuyerPack } from "@/components/ui";
import type { EsewaFormFields } from "@/buyer/api/orders";

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
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.submit();
  }, []);

  return (
    <BuyerPack>
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
          {t("payment.redirect.heading")}
        </div>
        <p style={{ fontSize: ".875rem", color: "var(--ink-500)", maxWidth: 360, margin: 0 }}>
          {t("payment.redirect.message")}
        </p>

        <form ref={formRef} method="POST" action={paymentUrl}>
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <Button type="submit" variant="primary" size="lg" style={{ marginTop: 4 }}>
            {t("payment.redirect.continue")}
          </Button>
        </form>
      </div>
    </BuyerPack>
  );
}
