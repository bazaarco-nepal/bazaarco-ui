export type VideoFeedTab = "foryou" | "following" | "nepal" | "flash";

export interface VideoFeedEngagement {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

// Mirrors the `store` object Core API returns on each video feed item
// (bazaarco-api videos.service.ts → mapFeedItem). The storefront models the
// merchant as `seller`; the API mapper adapts the field name.
export interface VideoFeedSeller {
  id: string;
  name: string;
  rating: number;
  reviewsCount: number;
  avatar: string;
}

export interface VideoFeedItem {
  id: string;
  name: string;
  price: number;
  original: number | null;
  cat: string;
  sellerId: string;
  icon: string;
  tint: string;
  rating: number;
  reviews: number;
  hasVideo: boolean;
  videoThumb: string | null;
  videoUrl: string | null;
  eta: string | null;
  tag: string | null;
  img: string | null;
  seller: VideoFeedSeller;
  engagement: VideoFeedEngagement;
  caption: string;
  liked: boolean;
}

export interface VideoFeedResponse {
  tab: VideoFeedTab;
  items: VideoFeedItem[];
}
