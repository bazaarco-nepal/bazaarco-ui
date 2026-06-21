import { Suspense } from "react";
import { EsewaCallback } from "@/buyer/features/payment/esewa-callback";

// eSewa success redirect target. A real route (not a SPA screen) so the cold
// full-page load from eSewa lands somewhere that can read the response and
// verify it server-side before anything is treated as paid.
export default function EsewaSuccessPage() {
  return (
    <Suspense fallback={null}>
      <EsewaCallback mode="success" />
    </Suspense>
  );
}
