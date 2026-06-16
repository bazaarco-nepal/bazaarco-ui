"use client";

function bargainStatus(o: {
  status?: string;
  accepted?: boolean;
  rejected?: boolean;
}): "accepted" | "rejected" | "countered" | "pending" {
  if (o.status === "accepted" || o.accepted) return "accepted";
  if (o.status === "rejected" || o.rejected) return "rejected";
  if (o.status === "countered") return "countered";
  return "pending";
}

export { bargainStatus };
