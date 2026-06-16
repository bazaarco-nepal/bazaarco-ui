"use client";



/* Reports/KYC/Notifications removed — merged into Analytics/Profile/Settings */

/* ---------- 4.17 Settings (includes Notifications) ---------- */
export const NOTIF_EVENTS = [
  {
    id: "new_order",
    labelKey: "seller.settings.events.newOrder",
    defaults: [true, true, true, false],
  },
  {
    id: "bargain",
    labelKey: "seller.settings.events.bargainOffer",
    defaults: [true, false, true, false],
  },
  {
    id: "low_stock",
    labelKey: "seller.settings.events.lowStock",
    defaults: [true, false, true, false],
  },
  {
    id: "new_review",
    labelKey: "seller.settings.events.newReview",
    defaults: [true, false, false, false],
  },
  {
    id: "payout",
    labelKey: "seller.settings.events.payoutSent",
    defaults: [true, true, true, true],
  },
  {
    id: "policy",
    labelKey: "seller.settings.events.policyUpdate",
    defaults: [true, false, false, true],
  },
];
export const NOTIF_CHANNELS = [
  { id: "in_app", labelKey: "seller.settings.channels.inApp", icon: "bell" },
  { id: "sms", labelKey: "seller.settings.channels.sms", icon: "message" },
  { id: "whatsapp", labelKey: "seller.settings.channels.whatsapp", icon: "headphones" },
  { id: "email", labelKey: "seller.settings.channels.email", icon: "file" },
];

/* ---------- KYC verification timeline ----------
   Always reachable from the sidebar so sellers who deferred KYC ("verify
   later") can come back and finish / track it. Renders the verification
   journey as a vertical timeline with event names + timestamps. */
