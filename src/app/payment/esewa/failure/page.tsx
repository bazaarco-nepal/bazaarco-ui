import { Suspense } from "react";
import { EsewaCallback } from "@/buyer/features/payment/esewa-callback";

// eSewa failure/cancel redirect target. If eSewa sent a response we still verify
// it server-side (which settles the payment as failed/cancelled and restores
// reserved stock); otherwise we simply show that the order was not confirmed.
export default function EsewaFailurePage() {
  return (
    <Suspense fallback={null}>
      <EsewaCallback mode="failure" />
    </Suspense>
  );
}
