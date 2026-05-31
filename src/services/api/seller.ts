import { getData } from "./http";

export const sellerApi = {
  getDashboard<T = unknown>(): Promise<T> {
    return getData<T>("/seller/dashboard");
  },

  getInbox<T = unknown>(): Promise<T> {
    return getData<T>("/seller/inbox");
  },

  getInventory<T = unknown>(): Promise<T> {
    return getData<T>("/seller/inventory");
  },

  getBargains<T = unknown>(): Promise<T> {
    return getData<T>("/seller/bargains");
  },

  getReviews<T = unknown>(): Promise<T> {
    return getData<T>("/seller/reviews");
  },

  getChat<T = unknown>(): Promise<T> {
    return getData<T>("/seller/chat");
  },

  getPromotions<T = unknown>(): Promise<T> {
    return getData<T>("/seller/promotions");
  },

  getVideos<T = unknown>(): Promise<T> {
    return getData<T>("/seller/videos");
  },

  getAnalytics<T = unknown>(): Promise<T> {
    return getData<T>("/seller/analytics");
  },

  getReports<T = unknown>(): Promise<T> {
    return getData<T>("/seller/reports");
  },

  getNotifications<T = unknown>(): Promise<T> {
    return getData<T>("/seller/notifications");
  },

  getStorefront<T = unknown>(): Promise<T> {
    return getData<T>("/seller/storefront");
  },

  getLedger<T = unknown>(): Promise<T> {
    return getData<T>("/seller/ledger");
  },
};
