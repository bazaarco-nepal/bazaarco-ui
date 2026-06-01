export type VideoFeedTab = "foryou" | "following" | "nepal" | "flash";

export interface VideoFeedEngagement {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export interface VideoFeedSeller {
  id: string;
  name: string;
  city: string;
  verified: boolean;
  rating: number;
  reviews: number;
  avatar: string;
  tint: string;
}

export interface VideoFeedItem {
  id: string;
  name: string;
  ne: string;
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
  hashtags: string[];
  liked: boolean;
}

export interface VideoFeedResponse {
  tab: VideoFeedTab;
  items: VideoFeedItem[];
}
