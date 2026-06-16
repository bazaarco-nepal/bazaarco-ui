"use client";



export const SELLER_NAV = [
  {
    groupKey: "seller.groupMyShop",
    items: [
      { id: "s-dashboard", icon: "home", labelKey: "seller.navHome" },
      { id: "s-add", icon: "plus", labelKey: "seller.navAddProduct" },
      { id: "s-inbox", icon: "package", labelKey: "seller.navOrders", badgeKey: "orders" },
      { id: "s-products", icon: "store", labelKey: "seller.navProducts" },
      { id: "s-chat", icon: "message", labelKey: "seller.navMessages", badgeKey: "chat" },
      { id: "s-videos", icon: "video", labelKey: "seller.navVideos" },
    ],
  },
  {
    groupKey: "seller.groupMore",
    items: [
      { id: "s-storefront", icon: "palette", labelKey: "seller.navStorefront" },
      { id: "s-bargain", icon: "bargain", labelKey: "seller.navBargaining", badgeKey: "bargain" },
      { id: "s-ledger", icon: "wallet", labelKey: "seller.navMoney" },
      { id: "s-analytics", icon: "trendingUp", labelKey: "seller.navAnalytics" },
      { id: "s-reviews", icon: "star", labelKey: "seller.navReviews" },
      { id: "s-verification", icon: "shieldCheck", labelKey: "seller.navKyc" },
      { id: "s-settings", icon: "settings", labelKey: "seller.navSettings" },
    ],
  },
];
