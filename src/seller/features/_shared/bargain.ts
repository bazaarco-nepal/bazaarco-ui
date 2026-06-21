"use client";

function bargainStatus(o: {
  status?: string;
  accepted?: boolean;
  rejected?: boolean;
}): "accepted" | "rejected" | "countered" | "expired" | "pending" {
  if (o.status === "accepted" || o.accepted) return "accepted";
  if (o.status === "rejected" || o.rejected) return "rejected";
  if (o.status === "countered") return "countered";
  // Step 5 — a seller no-response offer is expired and NOT actionable; it must
  // not collapse to "pending" (which would re-show accept/counter/reject).
  if (o.status === "expired") return "expired";
  return "pending";
}

export { bargainStatus };
