// @ts-nocheck — legacy design prototype; typed incrementally
"use client";

import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ASSETS } from "@/config/assets";
import { postalForCity, isDeliverableCity, DELIVERY_AREA_MESSAGE } from "@/lib/delivery-location";
import { reverseGeocode } from "@/lib/reverse-geocode";
import { tintForName, STORE_TINTS } from "@/lib/store-tint";
import { formatNPR } from "@/lib/money";
import { MapPinPicker } from "@/components/ui/map-pin-picker";
import { TOAST_VARIANT_META } from "@/lib/toast-variant";
import { CLOUDINARY_CLOUD_NAME, publicIdFromVideoUrl } from "@/lib/cloudinary";
import { SellerIcon } from "@/features/seller/_shared/icons";
import "cloudinary-video-player/cld-video-player.min.css";

/* ============================================================
   BazaarCo — Component Kit
   Icons (Lucide-style), Logo, Buttons, ProductCard, VideoPlayer,
   RatingStars, Chips, Skeletons, EmptyState (mascot), Toast.
   Exported to window for cross-file use.
   ============================================================ */
/* ---------- Icons ---------- */
export const ICON_PATHS = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  zoomIn: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </>
  ),
  heart: (
    <path d="M19 14c1.5-1.5 3-3.2 3-5.5A4.5 4.5 0 0 0 12 5.5 4.5 4.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />
  ),
  cart: (
    <>
      <circle cx="9" cy="21" r="1.6" />
      <circle cx="18" cy="21" r="1.6" />
      <path d="M2.5 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 7H6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </>
  ),
  chevronLeft: <polyline points="15 18 9 12 15 6" />,
  chevronRight: <polyline points="9 18 15 12 9 6" />,
  chevronDown: <polyline points="6 9 12 15 18 9" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <path d="M12 3a14.5 14.5 0 0 1 0 18 14.5 14.5 0 0 1 0-18Z" />
    </>
  ),
  star: (
    <polygon points="12 2 15.1 8.6 22 9.3 17 14.1 18.2 21 12 17.6 5.8 21 7 14.1 2 9.3 8.9 8.6" />
  ),
  shieldCheck: (
    <>
      <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v9H3z" />
      <path d="M14 9h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17.5" cy="18" r="1.8" />
    </>
  ),
  returns: (
    <>
      <polyline points="3 4 3 10 9 10" />
      <path d="M3.5 10a8 8 0 1 1-1.5 5" />
    </>
  ),
  play: <polygon points="7 4 20 12 7 20 7 4" />,
  fastForward: (
    <>
      <polygon points="3 5 12 12 3 19 3 5" />
      <polygon points="13 5 22 12 13 19 13 5" />
    </>
  ),
  pause: (
    <>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </>
  ),
  volume: (
    <>
      <polygon points="4 9 8 9 13 5 13 19 8 15 4 15 4 9" />
      <path d="M17 8a5 5 0 0 1 0 8" />
    </>
  ),
  mute: (
    <>
      <polygon points="4 9 8 9 13 5 13 19 8 15 4 15 4 9" />
      <line x1="17" y1="9" x2="22" y2="14" />
      <line x1="22" y1="9" x2="17" y2="14" />
    </>
  ),
  badgeCheck: (
    <>
      <path d="m12 2 2.4 1.8 3-.2.9 2.9 2.4 1.8-1 2.9 1 2.9-2.4 1.8-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9L3.3 16l1-2.9-1-2.9 2.4-1.8.9-2.9 3 .2Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  mapPin: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  minus: <line x1="5" y1="12" x2="19" y2="12" />,
  x: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />,
  percent: (
    <>
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </>
  ),
  zap: <polygon points="13 2 3 14 11 14 9 22 21 10 13 10 13 2" />,
  tag: (
    <>
      <path d="M3 11.5V4a1 1 0 0 1 1-1h7.5a2 2 0 0 1 1.4.6l7 7a2 2 0 0 1 0 2.8l-6.5 6.5a2 2 0 0 1-2.8 0l-7-7A2 2 0 0 1 3 11.5Z" />
      <circle cx="7.5" cy="7.5" r="1.3" />
    </>
  ),
  bargain: (
    <>
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25H21" />
      <path d="m21 3 1 11h-2" />
      <path d="M3 4h8" />
      <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
    </>
  ),
  video: (
    <>
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="m16 10 6-3v10l-6-3Z" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 16-5-5-9 9" />
    </>
  ),
  camera: (
    <>
      <path d="M14.5 5 13 3H9L7.5 5H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4.5Z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </>
  ),
  sliders: (
    <>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="9" cy="6" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="8" cy="18" r="2.2" fill="currentColor" stroke="none" />
    </>
  ),
  arrowLeft: (
    <>
      <line x1="20" y1="12" x2="5" y2="12" />
      <polyline points="11 18 5 12 11 6" />
    </>
  ),
  arrowRight: (
    <>
      <line x1="4" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </>
  ),
  package: (
    <>
      <path d="m12 2 9 5v10l-9 5-9-5V7Z" />
      <path d="m3 7 9 5 9-5" />
      <line x1="12" y1="12" x2="12" y2="22" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 16 14" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </>
  ),
  store: (
    <>
      <path d="M3 9 4.5 4h15L21 9" />
      <path d="M4 9v11h16V9" />
      <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
    </>
  ),
  headphones: (
    <>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="2.5" y="14" width="4" height="6" rx="1.5" />
      <rect x="17.5" y="14" width="4" height="6" rx="1.5" />
    </>
  ),
  trendingUp: (
    <>
      <polyline points="3 16 9 10 13 14 21 6" />
      <polyline points="15 6 21 6 21 12" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <circle cx="17" cy="14" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  logout: (
    <>
      <path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" />
      <polyline points="16 16 20 12 16 8" />
      <line x1="20" y1="12" x2="9" y2="12" />
    </>
  ),
  share: (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <line x1="8.2" y1="11" x2="15.8" y2="7" />
      <line x1="8.2" y1="13" x2="15.8" y2="17" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </>
  ),
  menu: (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  shirt: <path d="M16 3 21 7l-3 3-2-1.5V21H8V8.5L6 10 3 7l5-4 2 2a2 2 0 0 0 4 0Z" />,
  home: (
    <>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v10h12V10" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 0 0 0 18 2.4 2.4 0 0 0 2.4-2.4c0-.6-.3-1.1-.6-1.6-.3-.4-.6-.9-.6-1.5a1.5 1.5 0 0 1 1.5-1.5H17a5 5 0 0 0 5-5c0-3.9-4.5-7-10-7Z" />
      <circle cx="7.5" cy="11" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="11" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3 13.6 8.4 19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6Z" />
      <path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7Z" />
    </>
  ),
  lipstick: (
    <>
      <path d="M9 9.5 8.2 4.2a1.5 1.5 0 0 1 .9-1.6l3-1.3a1 1 0 0 1 1.3.6l1.4 3.9a1.5 1.5 0 0 1-.5 1.7L11 9.5Z" />
      <rect x="8.5" y="9.5" width="7" height="4" rx="1" />
      <rect x="9.5" y="13.5" width="5" height="8" rx="1.2" />
    </>
  ),
  temple: (
    <>
      <path d="M12 2 5 6h14Z" />
      <path d="M6.5 6 4 10h16l-2.5-4" />
      <path d="M8 10 6 14h12l-2-4" />
      <path d="M7.5 14v7M16.5 14v7" />
      <path d="M11 21v-4a1 1 0 0 1 2 0v4" />
    </>
  ),
  sneaker: (
    <>
      <path d="M2 16.5V12c0-.6.4-1 1-1h2.6c.4 0 .8.2 1.1.5L9 14l4.5 1.2c1 .3 1.9.7 2.7 1.4l3.4 2.6c.6.4.9 1.1.9 1.8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1Z" />
      <path d="M9 14l1.5-3" />
      <path d="M2 19h18.5" />
    </>
  ),
  sofa: (
    <>
      <path d="M4 11V8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5V11" />
      <path d="M3 12.5A1.5 1.5 0 0 1 4.5 11h0A1.5 1.5 0 0 1 6 12.5V14h12v-1.5a1.5 1.5 0 0 1 3 0V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
      <path d="M6 18v2M18 18v2" />
    </>
  ),
  pacifier: (
    <>
      <circle cx="12" cy="15" r="3" />
      <ellipse cx="12" cy="9" rx="5" ry="2.5" />
      <circle cx="12" cy="4.5" r="2" />
    </>
  ),
  handbag: (
    <>
      <path d="M4.5 8h15l1 12.5a1 1 0 0 1-1 1.1H4.5a1 1 0 0 1-1-1.1Z" />
      <path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8" />
    </>
  ),
  football: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5 15.8 10.3 14.3 14.8H9.7L8.2 10.3Z" />
      <path d="M12 7.5V3M15.8 10.3 20 9M14.3 14.8 17 18.5M9.7 14.8 7 18.5M8.2 10.3 4 9" />
    </>
  ),
  phone: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <line x1="10.5" y1="18" x2="13.5" y2="18" />
    </>
  ),
  basket: (
    <>
      <path d="M5 11 8 4M19 11 16 4" />
      <path d="M2.5 11h19l-1.6 8a2 2 0 0 1-2 1.6H6.1a2 2 0 0 1-2-1.6Z" />
      <line x1="9" y1="14" x2="9.5" y2="18" />
      <line x1="15" y1="14" x2="14.5" y2="18" />
    </>
  ),
  book: (
    <>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5Z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M6.5 6.5 17.5 17.5M3 9l3-3M21 15l-3 3" />
      <rect x="1.5" y="8" width="4" height="8" rx="1.2" transform="rotate(45 3.5 12)" />
    </>
  ),
  bowl: (
    <>
      <path d="M3 11h18a9 9 0 0 1-18 0Z" />
      <path d="M12 3c-2 1.5-2 3.5 0 5" />
    </>
  ),
  flame: (
    <path d="M12 2c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1-.3-2-1-3 .3 3-1.5 4-2.5 4 1-2.5-1.5-4-2.5-8Z" />
  ),
  gift: (
    <>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M5 12v9h14v-9" />
      <line x1="12" y1="8" x2="12" y2="21" />
      <path d="M12 8C12 5 10 3 8 4.5S8 8 12 8Zm0 0c0-3 2-5 4-3.5S16 8 12 8Z" />
    </>
  ),
  leaf: (
    <>
      <path d="M11 20A7 7 0 0 1 4 13c0-5 5-9 16-9 0 9-4 16-9 16Z" />
      <path d="M11 20c0-5 3-9 9-13" />
    </>
  ),
  watch: (
    <>
      <circle cx="12" cy="12" r="6" />
      <polyline points="12 9 12 12 14 13" />
      <path d="M9 6 8.5 2h7L15 6M9 18l-.5 4h7L15 18" />
    </>
  ),
  message: (
    <>
      <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12Z" />
    </>
  ),
  messageDots: (
    <>
      <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12Z" />
      <circle cx="8.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  bell: (
    <>
      <path d="M6 17V11a6 6 0 1 1 12 0v6l2 3H4Z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="14" y2="17" />
    </>
  ),
  filePlus: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="12" x2="12" y2="18" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </>
  ),
  printer: (
    <>
      <path d="M6 9V3h12v6" />
      <rect x="3" y="9" width="18" height="9" rx="2" />
      <rect x="7" y="14" width="10" height="7" />
    </>
  ),
  layout: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </>
  ),
  kanban: (
    <>
      <rect x="3" y="3" width="5" height="18" rx="1.5" />
      <rect x="10" y="3" width="5" height="12" rx="1.5" />
      <rect x="17" y="3" width="4" height="8" rx="1.5" />
    </>
  ),
  layers: (
    <>
      <polygon points="12 2 22 7 12 12 2 7 12 2" />
      <polyline points="2 12 12 17 22 12" />
      <polyline points="2 17 12 22 22 17" />
    </>
  ),
  handshake: (
    <>
      <path d="M4 14l4-4 3 3 5-5 4 4-7 7-2-2-3 3Z" />
      <path d="M11 13l3-3" />
    </>
  ),
  megaphone: (
    <>
      <path d="M3 11v3l9 4V7Z" />
      <path d="M12 7c4-1 8-3 8-3v14s-4-2-8-3" />
      <path d="M8 14a3 3 0 0 0 4 3" />
    </>
  ),
  ticket: (
    <>
      <path d="M3 9a2 2 0 0 0 0 4v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0 0-4V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" />
      <line x1="13" y1="5" x2="13" y2="19" />
    </>
  ),
  edit: (
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.1 2.1 0 1 1 3 3L12 15l-4 1 1-4Z" />
    </>
  ),
  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </>
  ),
  flag: (
    <>
      <path d="M4 21V4h12l-2 4 2 4H4" />
    </>
  ),
  building: (
    <>
      <line x1="3" y1="21" x2="21" y2="21" />
      <path d="M5 21V7l8-4v18" />
      <path d="M19 21V11l-6-3.5" />
      <line x1="9" y1="9" x2="9" y2="9.01" />
      <line x1="9" y1="12" x2="9" y2="12.01" />
      <line x1="9" y1="15" x2="9" y2="15.01" />
      <line x1="9" y1="18" x2="9" y2="18.01" />
    </>
  ),
  locate: (
    <>
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
    </>
  ),
  refresh: (
    <>
      <polyline points="20 9 17 12 14 9" />
      <path d="M17 12V8a5 5 0 0 0-9-3" />
      <polyline points="4 15 7 12 10 15" />
      <path d="M7 12v4a5 5 0 0 0 9 3" />
    </>
  ),
  trendingDown: (
    <>
      <polyline points="3 8 9 14 13 10 21 18" />
      <polyline points="15 18 21 18 21 12" />
    </>
  ),
  flame2: (
    <path d="M12 2c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1-.3-2-1-3 .3 3-1.5 4-2.5 4 1-2.5-1.5-4-2.5-8Z" />
  ),
  chevronUp: <polyline points="6 15 12 9 18 15" />,
  instagram: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" />
    </>
  ),
  linkedin: (
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6ZM2 9h4v12H2ZM4 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
  ),
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z" />,
  tiktok: (
    <path d="M16 3c.4 2.2 1.9 3.9 4 4.3v3.1a7 7 0 0 1-4-1.4V15a6 6 0 1 1-6-6c.35 0 .7.03 1 .1v3.2a3 3 0 1 0 2 2.8V3h3Z" />
  ),
};
type IconRenderer = (props: {
  name: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}) => React.ReactNode;
export const IconOverrideContext = createContext<IconRenderer | null>(null);

export function Icon({
  name,
  size = 22,
  stroke = 1.8,
  fill = "none",
  color,
  className,
  style,
}: {
  name: string;
  size?: number;
  stroke?: number;
  fill?: string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const override = useContext(IconOverrideContext);
  if (override) return <>{override({ name, size, color, style, className })}</>;
  const p = ICON_PATHS[name];
  if (!p) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={fill === "currentColor" ? "none" : "currentColor"}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color, display: "block", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {p}
    </svg>
  );
}

/* ---------- Logo ---------- */
export function Logo({ height = 40, mono = false }: { height?: number; mono?: boolean }) {
  return (
    <img
      src={ASSETS.logo}
      alt="BazaarCo"
      style={{
        height,
        width: "auto",
        display: "block",
        filter: mono ? "brightness(0) invert(1)" : "none",
      }}
    />
  );
}

/* ---------- Button (5 variants from brief) ---------- */
/* ---------- Navigation link ----------
   Renders a real <a href> so the browser handles ⌘/Ctrl-click, middle-click,
   and right-click → "Open in new tab" natively. Plain left-click is intercepted
   for client-side SPA navigation. Pass `onNavigate` to run the app's own
   navigation side-effects (e.g. setting the active product) on left-click;
   otherwise it falls back to a router push. */
function useSpaLinkClick(href, onNavigate, target) {
  const router = useRouter();
  return (e) => {
    // Let the browser do its thing for new-tab / new-window intents.
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      target === "_blank"
    ) {
      return;
    }
    e.preventDefault();
    if (onNavigate) {
      onNavigate();
    } else if (href) {
      router.push(href);
      if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    }
  };
}

export function AppLink({
  href,
  onNavigate,
  children,
  className,
  style,
  ariaLabel,
  title,
  target,
  rel,
  tabIndex,
  ...rest
}: {
  href: string;
  onNavigate?: () => void;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  title?: string;
  target?: string;
  rel?: string;
  tabIndex?: number;
  [key: string]: any;
}) {
  const onClick = useSpaLinkClick(href, onNavigate, target);
  return (
    <a
      href={href}
      onClick={onClick}
      className={className}
      style={style}
      aria-label={ariaLabel}
      title={title}
      target={target}
      rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)}
      tabIndex={tabIndex}
      {...rest}
    >
      {children}
    </a>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  full,
  loading,
  disabled,
  icon,
  iconRight,
  children,
  onClick,
  type = "button",
  style,
  className,
  href,
  onNavigate,
  target,
}: {
  variant?: string;
  size?: string;
  full?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconRight?: string;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  style?: React.CSSProperties;
  className?: string;
  // When `href` is set, the button renders as a real <a> so the browser can
  // open it in a new tab (⌘/Ctrl/middle/right-click). Left-click does SPA nav.
  href?: string;
  onNavigate?: () => void;
  target?: string;
}) {
  const h = size === "lg" ? 52 : size === "sm" ? 36 : 44;
  const fs = size === "lg" ? "1.125rem" : size === "sm" ? ".875rem" : "1rem";
  const pad = size === "lg" ? "0 28px" : size === "sm" ? "0 14px" : "0 22px";
  const base = {
    height: h,
    padding: pad,
    fontFamily: "var(--font-sans)",
    fontSize: fs,
    fontWeight: 600,
    borderRadius: "var(--r-control)",
    border: "1.5px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: full ? "100%" : "auto",
    transition:
      "background var(--dur-standard) var(--ease), border-color var(--dur-standard) var(--ease), color var(--dur-standard) var(--ease)",
    whiteSpace: "nowrap",
    lineHeight: 1,
    userSelect: "none",
    // Buttons with an `href` render as <a>; kill the default anchor underline so
    // link-buttons (e.g. "Continue shopping") look identical to real buttons.
    textDecoration: "none",
    ...style,
  };
  // Primary = recommended action (Continue, Submit, Buy). Secondary = alternate / neutral outline.
  const variants = {
    primary: { background: "var(--blue)", color: "#fff", borderColor: "var(--blue)" },
    // Secondary colors are themeable: a skin (e.g. Fluent) can remap them via
    // --btn-secondary-*; with no override they fall back to neutral ink outline.
    secondary: {
      background: "#fff",
      color: "var(--btn-secondary-fg, var(--ink-700))",
      borderColor: "var(--btn-secondary-border, var(--ink-700))",
    },
    ghost: { background: "transparent", color: "var(--ink-500)", borderColor: "transparent" },
    danger: { background: "#fff", color: "var(--danger)", borderColor: "var(--danger)" },
    blue: { background: "var(--blue)", color: "#fff", borderColor: "var(--blue)" },
  };
  if (disabled) {
    variants[variant] = {
      background: "var(--line-100)",
      color: "var(--ink-300)",
      borderColor: "var(--line-100)",
    };
  }
  const [hov, setHov] = useState(false);
  const linkClick = useSpaLinkClick(href, onNavigate, target);
  let merged = { ...base, ...variants[variant] };
  if (hov && !disabled) {
    if (variant === "primary" || variant === "blue") merged.background = "var(--blue-hover)";
    else if (variant === "secondary") {
      merged.background = "var(--btn-secondary-hover-bg, var(--ink-700))";
      merged.color = "var(--btn-secondary-hover-fg, #fff)";
      merged.borderColor = "var(--btn-secondary-border, var(--ink-700))";
    } else if (variant === "ghost") {
      merged.background = "var(--line-100)";
      merged.color = "var(--ink-700)";
    } else if (variant === "danger") {
      merged.background = "var(--danger)";
      merged.color = "#fff";
    }
  }
  const inner = loading ? (
    <Spinner />
  ) : (
    <>
      {icon && <Icon name={icon} size={size === "lg" ? 20 : 18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "lg" ? 20 : 18} />}
    </>
  );

  // Real anchor when navigating — enables open-in-new-tab. Disabled/loading nav
  // buttons fall back to a plain button so they stay inert.
  if (href && !disabled && !loading) {
    return (
      <a
        href={href}
        className={className}
        style={merged}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={(e) => {
          onClick?.(e);
          linkClick(e);
        }}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={className}
      style={merged}
      disabled={disabled || loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      aria-busy={loading || undefined}
    >
      {inner}
    </button>
  );
}
export function Spinner({ size = 18, color = "currentColor" }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        border: `2px solid ${color}`,
        borderTopColor: "transparent",
        borderRadius: "50%",
        display: "inline-block",
        animation: "bz-spin .7s linear infinite",
      }}
    />
  );
}
type IconButtonProps = {
  name: string;
  label: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  active?: boolean;
  badge?: number;
  size?: number;
  title?: string;
  href?: string;
  onNavigate?: () => void;
  target?: React.HTMLAttributeAnchorTarget;
};

export function IconButton({
  name,
  onClick,
  active,
  badge,
  label,
  size = 40,
  title,
  href,
  onNavigate,
  target,
}: IconButtonProps) {
  const [hov, setHov] = useState(false);
  const linkClick = useSpaLinkClick(href, onNavigate, target);
  const Tag = href ? "a" : "button";
  return (
    <Tag
      href={href || undefined}
      target={href ? target : undefined}
      rel={href && target === "_blank" ? "noopener noreferrer" : undefined}
      onClick={
        href
          ? (e) => {
              onClick?.(e);
              linkClick(e);
            }
          : onClick
      }
      title={title || label}
      aria-label={label}
      style={{
        width: size,
        height: size,
        borderRadius: "var(--r-md)",
        border: "1px solid var(--line-200)",
        background: hov ? "var(--line-100)" : "#fff",
        cursor: "pointer",
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? "var(--red)" : "var(--ink-700)",
        transition: "all var(--dur-standard) var(--ease)",
        flexShrink: 0,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <Icon name={name} size={20} fill={active && name === "heart" ? "currentColor" : "none"} />
      {badge > 0 && (
        <span
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            minWidth: 18,
            height: 18,
            padding: "0 5px",
            background: "var(--red)",
            color: "#fff",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #fff",
          }}
          className="tnum"
        >
          {badge}
        </span>
      )}
    </Tag>
  );
}

/* ---------- Rating stars ---------- */
function toRatingNumber(value) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(5, n)) : 0;
}

function toReviewCount(count) {
  if (count == null) return null;
  const n = typeof count === "number" ? count : Number(count);
  return Number.isFinite(n) ? n : 0;
}

export function RatingStars({
  value,
  size = 15,
  showVal,
  count,
}: {
  value: number;
  size?: number;
  showVal?: boolean;
  count?: number;
}) {
  const rating = toRatingNumber(value);
  const reviewCount = toReviewCount(count);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ display: "inline-flex", gap: 1 }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const fillPct = Math.max(0, Math.min(1, rating - i));
          return (
            <span
              key={i}
              style={{ position: "relative", width: size, height: size, display: "inline-block" }}
            >
              <Icon
                name="star"
                size={size}
                color="var(--line-200)"
                fill="var(--line-200)"
                style={{ position: "absolute", inset: 0 }}
              />
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${fillPct * 100}%`,
                  overflow: "hidden",
                }}
              >
                <Icon name="star" size={size} color="var(--gold)" fill="var(--gold)" />
              </span>
            </span>
          );
        })}
      </span>
      {showVal && (
        <span
          className="tnum"
          style={{ fontSize: ".8125rem", fontWeight: 700, color: "var(--ink-700)" }}
        >
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount != null && (
        <span className="tnum" style={{ fontSize: ".8125rem", color: "var(--ink-400)" }}>
          ({reviewCount.toLocaleString("en-IN")})
        </span>
      )}
    </span>
  );
}

/* ---------- Compact rating ----------
   The single-line "★ 4.6 (128)" summary used beside a product title. Rating
   honesty: with zero reviews it shows an OUTLINE star + "No reviews yet" rather
   than a filled gold star against "(0)", which reads like a real score. */
export function RatingInline({
  rating,
  count,
  size = 14,
}: {
  rating: number;
  count?: number | null;
  size?: number;
}) {
  const reviewCount = toReviewCount(count) ?? 0;
  if (reviewCount <= 0) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: ".8125rem",
          color: "var(--ink-400)",
        }}
      >
        <Icon name="star" size={size} color="var(--ink-300)" fill="none" />
        No reviews yet
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: ".8125rem",
        color: "var(--ink-500)",
      }}
    >
      <Icon name="star" size={size} color="var(--gold)" fill="var(--gold)" />
      <span className="tnum" style={{ color: "var(--ink-700)", fontWeight: 700 }}>
        {toRatingNumber(rating).toFixed(1)}
      </span>
      <span className="tnum">({reviewCount.toLocaleString("en-IN")})</span>
    </span>
  );
}

/* ---------- Chips / badges ---------- */
export function Chip({
  children,
  tone = "neutral",
  icon,
  size = "md",
}: {
  children: React.ReactNode;
  tone?: string;
  icon?: string;
  size?: string;
}) {
  const tones = {
    neutral: { bg: "var(--line-100)", fg: "var(--ink-700)" },
    red: { bg: "var(--tint-red-50)", fg: "var(--red)" },
    blue: { bg: "var(--tint-blue-50)", fg: "var(--blue)" },
    gold: { bg: "rgba(212,160,23,.12)", fg: "#9a7407" },
    saffron: { bg: "rgba(247,127,0,.12)", fg: "#b85e00" },
    success: { bg: "rgba(22,163,74,.1)", fg: "var(--success)" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: t.bg,
        color: t.fg,
        fontSize: size === "sm" ? ".6875rem" : ".75rem",
        fontWeight: 700,
        padding: size === "sm" ? "3px 10px" : "5px 12px",
        // Skinnable shape: a skin can make status chips rounded pills (Fluent
        // seller) via --chip-radius; buyer falls back to the squared --r-sm.
        borderRadius: "var(--chip-radius, var(--r-sm))",
        lineHeight: 1.1,
        whiteSpace: "nowrap",
      }}
    >
      {icon && <Icon name={icon} size={size === "sm" ? 12 : 14} />}
      {children}
    </span>
  );
}

/* ---------- Badge — the single pill system ----------
   One shape for every status/discount/trust pill: a fully-rounded, borderless
   pill at a fixed small height with consistent padding and medium-weight text.
   Meaning comes through semantic colour ONLY — a soft tint fill + matching text —
   so no badge ever reads as an outlined button or competes on shape. `dot` adds a
   small solid status dot and `icon` a leading glyph: redundant, non-colour cues
   so a badge still reads for colourblind users. */
export function Badge({
  children,
  tone = "neutral",
  dot = false,
  icon,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "danger" | "saffron" | "blue";
  dot?: boolean;
  icon?: string;
}) {
  // Every tone is the same recipe — a soft tint fill + a matching foreground —
  // so badges differ ONLY by colour, never by border or shape.
  const tones = {
    neutral: { bg: "var(--line-100)", fg: "var(--ink-700)" },
    success: { bg: "rgba(22,163,74,.12)", fg: "var(--success)" },
    danger: { bg: "rgba(185,28,28,.1)", fg: "var(--danger)" },
    saffron: { bg: "rgba(247,127,0,.12)", fg: "#b85e00" },
    blue: { bg: "var(--tint-blue-50)", fg: "var(--blue)" },
  };
  const tn = tones[tone] ?? tones.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 26,
        padding: "0 11px",
        borderRadius: "var(--r-pill)",
        background: tn.bg,
        color: tn.fg,
        fontSize: ".75rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
        lineHeight: 1,
      }}
    >
      {dot && (
        <span
          aria-hidden
          style={{ width: 7, height: 7, borderRadius: "50%", background: tn.fg, flex: "0 0 auto" }}
        />
      )}
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}

export function StatusPill({ status }) {
  const { t } = useTranslation();
  const map = {
    new: { tone: "blue", key: "new" },
    placed: { tone: "blue", key: "placed" },
    applied: { tone: "blue", key: "applied" },
    accepted: { tone: "blue", key: "accepted" },
    packing: { tone: "saffron", key: "packing" },
    packaging_started: { tone: "saffron", key: "packaging_started" },
    packed: { tone: "saffron", key: "packed" },
    ready_for_pickup: { tone: "saffron", key: "ready_for_pickup" },
    picked_up: { tone: "blue", key: "picked_up" },
    arrived_at_hub: { tone: "blue", key: "arrived_at_hub" },
    out_for_delivery: { tone: "blue", key: "out_for_delivery" },
    shipped: { tone: "blue", key: "shipped" },
    delivered: { tone: "success", key: "delivered" },
    confirmed: { tone: "blue", key: "confirmed" },
    cancelled: { tone: "neutral", key: "cancelled" },
  };
  const m = map[status] || map.new;
  return <Chip tone={m.tone}>{t(`orders.status.${m.key}`)}</Chip>;
}

/* ---------- Price ---------- */
export function Price({
  value,
  original,
  size = "md",
  color = "var(--blue-deep)",
}: {
  value?: number;
  original?: number;
  size?: "sm" | "md" | "lg";
  color?: string;
}) {
  const fs = size === "lg" ? "1.75rem" : size === "sm" ? "1rem" : "1.25rem";
  const safeValue = value ?? 0;
  const safeOriginal = original && original > safeValue ? original : null;
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
      <span
        className="tnum"
        style={{ fontSize: fs, fontWeight: 800, color, letterSpacing: "-.01em" }}
      >
        {formatNPR(safeValue)}
      </span>
      {safeOriginal && (
        <span
          className="tnum"
          style={{
            fontSize: size === "lg" ? "1rem" : ".8125rem",
            color: "var(--ink-400)",
            textDecoration: "line-through",
            fontWeight: 500,
          }}
        >
          {formatNPR(safeOriginal)}
        </span>
      )}
    </span>
  );
}

/* ---------- Product image placeholder ---------- */
export const TINTS = {
  red: ["#FFF1F2", "#FECDD3", "#E63946"],
  blue: ["#EFF6FF", "#BFDBFE", "#1D4ED8"],
  gold: ["#FEF7E6", "#FAE6B0", "#B8860B"],
  green: ["#ECFDF5", "#BBF7D0", "#16A34A"],
  slate: ["#F1F5F9", "#CBD5E1", "#475569"],
  saffron: ["#FFF4E6", "#FDD8A8", "#F77F00"],
  purple: ["#F5F3FF", "#DDD6FE", "#6D28D9"],
  teal: ["#F0FDFA", "#99F6E4", "#0D9488"],
};

// First grapheme of a name, Unicode-safe and locale-uppercased, so non-Latin
// scripts (e.g. Devanagari "मेरो" → "म") yield a sensible monogram instead of a
// broken half-character. Prefers Intl.Segmenter for true grapheme clusters and
// falls back to a code-point spread where it's unavailable. "?" when empty.
function storeMonogram(name?: string | null): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "?";
  let first: string | undefined;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    first = seg.segment(trimmed)[Symbol.iterator]().next().value?.segment;
  } else {
    first = [...trimmed][0];
  }
  return (first ?? "?").toLocaleUpperCase();
}

/**
 * A store's brand mark as rendered across BazaarCo: a soft SQUIRCLE tile (a brand
 * identity, not a personal/profile circle) holding the shop logo, falling back to
 * the first letter of the name on a deterministic brand tint. The tint is hashed
 * from the store name (see `tintForName`) so the same shop is always the same
 * colour and a grid of them never looks like a random crayon box. Single source
 * of truth for every store/seller mark — /stores cards, store page header, seller
 * sidebar, video seller chip, PDP store card, store-link preview. The 30% radius
 * gives the same squircle from 28px (sidebar) to 72px (store page); the monogram
 * sits optically centred and scales to ~46% of the tile.
 *
 * `src` is the uploaded store logo (logoUrl) — when present it wins and the
 * monogram is skipped. The monogram letter is decorative; the tile carries an
 * aria-label of the store name.
 */
export function StoreAvatar({
  src,
  name,
  size = 56,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
}) {
  const t = STORE_TINTS[tintForName(name)] ?? STORE_TINTS.slate;
  return (
    <div
      role="img"
      aria-label={name?.trim() || "Store"}
      style={{
        width: size,
        height: size,
        borderRadius: "30%",
        overflow: "hidden",
        flexShrink: 0,
        border: `1px solid ${src ? "var(--line-200)" : t.border}`,
        background: src ? "var(--line-100)" : t.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <span
          aria-hidden
          style={{
            lineHeight: 1,
            fontWeight: 500,
            fontSize: Math.round(size * 0.46),
            color: t.ink,
          }}
        >
          {storeMonogram(name)}
        </span>
      )}
    </div>
  );
}

export function Placeholder({
  icon = "package",
  tint = "slate",
  radius = "var(--r-lg)",
  ratio,
  label,
  style,
  animate,
}: {
  icon?: string;
  tint?: string;
  radius?: string;
  ratio?: string;
  label?: React.ReactNode;
  style?: React.CSSProperties;
  animate?: boolean;
}) {
  const c = TINTS[tint] || TINTS.slate;
  const inner = (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(145deg, ${c[0]}, ${c[1]})`,
        overflow: "hidden",
      }}
    >
      <Icon
        name={icon}
        size="38%"
        color={c[2]}
        stroke={1.4}
        style={{
          opacity: 0.55,
          width: "38%",
          height: "38%",
          animation: animate ? "bz-kenburns 9s ease-in-out infinite alternate" : "none",
        }}
      />
      {label && (
        <span
          style={{
            position: "absolute",
            bottom: 8,
            right: 10,
            fontSize: 10,
            fontWeight: 700,
            color: c[2],
            opacity: 0.5,
            textTransform: "uppercase",
            letterSpacing: ".06em",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
  if (ratio)
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: ratio,
          borderRadius: radius,
          overflow: "hidden",
          ...style,
        }}
      >
        {inner}
      </div>
    );
  return (
    <div style={{ position: "relative", borderRadius: radius, overflow: "hidden", ...style }}>
      {inner}
    </div>
  );
}

/* ---------- Simulated video player ---------- */
export function VideoPlayer({
  tint = "blue",
  icon = "shirt",
  ratio = "4 / 5",
  radius = "var(--r-lg)",
  autoplay,
  label,
  overlay,
  compact,
  fill,
  thumb,
  src,
  publicId,
  externalMuted,
  onMutedChange,
  onLongPressStart,
  onLongPressEnd,
  playbackRate,
  isActive,
  deferStream,
  streamProfile = "hd",
}: {
  tint?: string;
  icon?: string;
  ratio?: string;
  radius?: string;
  autoplay?: boolean;
  label?: React.ReactNode;
  overlay?: React.ReactNode;
  compact?: boolean;
  fill?: boolean;
  thumb?: string | null;
  src?: string | null;
  publicId?: string | null;
  externalMuted?: boolean;
  onMutedChange?: (muted: boolean) => void;
  onLongPressStart?: () => void;
  onLongPressEnd?: () => void;
  playbackRate?: number;
  isActive?: boolean;
  /** Wait for a play tap before attaching HLS / video src — keeps PDP light. */
  deferStream?: boolean;
  streamProfile?: "auto" | "hd" | "sd" | "full_hd" | "full_hd_wifi";
}) {
  const videoRef = useRef(null);
  const cloudinaryPlayerRef = useRef(null);
  const [hlsReady, setHlsReady] = useState(false);
  const [playing, setPlaying] = useState(!!autoplay);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(18);
  const [internalMuted, setInternalMuted] = useState(true);
  const [fastForwarding, setFastForwarding] = useState(false);
  const longPressTimer = useRef(null);
  const muted = externalMuted !== undefined ? externalMuted : internalMuted;
  const setMuted = (v) => {
    const next = typeof v === "function" ? v(muted) : v;
    if (onMutedChange) onMutedChange(next);
    else setInternalMuted(next);
  };
  const streamPublicId = (publicId?.trim() || publicIdFromVideoUrl(src)) ?? null;
  const useHls = Boolean(streamPublicId && CLOUDINARY_CLOUD_NAME);
  const hasSrc = useHls || Boolean(src);
  const shouldAttachStream = hasSrc && (!deferStream || playing || hlsReady);
  // In a feed, only the active reel may play and be audible. When `isActive`
  // isn't passed (e.g. product-card players) the player behaves as a standalone.
  const active = isActive === undefined ? true : isActive;

  useEffect(() => {
    if (!useHls || !videoRef.current || !shouldAttachStream) return;

    let disposed = false;
    setHlsReady(false);

    import("cloudinary-video-player").then((cloudinaryjs) => {
      if (disposed || !videoRef.current) return;

      if (cloudinaryPlayerRef.current?.dispose) {
        cloudinaryPlayerRef.current.dispose();
      }

      const player = cloudinaryjs.videoPlayer(videoRef.current, {
        cloudName: CLOUDINARY_CLOUD_NAME,
        muted: true,
        autoplay: false,
        loop: true,
        controls: false,
        showLogo: false,
      });

      cloudinaryPlayerRef.current = player;

      player.source(streamPublicId, {
        sourceTypes: ["hls"],
        transformation: { streaming_profile: streamProfile },
      });

      // Cloudinary's lazy player is a deferred proxy — wait until the real
      // VideoPlayer exists before calling play/mute (wrong names like .muted()
      // throw "realPlayer[method] is not a function").
      Promise.resolve(player)
        .then(() => {
          if (!disposed) setHlsReady(true);
        })
        .catch(() => {
          if (!disposed) setPlaying(false);
        });
    });

    return () => {
      disposed = true;
      setHlsReady(false);
      if (cloudinaryPlayerRef.current?.dispose) {
        cloudinaryPlayerRef.current.dispose();
        cloudinaryPlayerRef.current = null;
      }
    };
  }, [streamPublicId, streamProfile, useHls, shouldAttachStream]);

  useEffect(() => {
    if (!useHls || !hlsReady || !videoRef.current) return;
    const el = videoRef.current;
    const onTime = () => setT(el.currentTime || 0);
    const onMeta = () => setDur(el.duration || 18);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
    };
  }, [useHls, hlsReady, streamPublicId]);

  useEffect(() => {
    if (hasSrc || !playing) return;
    const id = setInterval(() => setT((x) => (x + 0.1 >= dur ? 0 : x + 0.1)), 100);
    return () => clearInterval(id);
  }, [playing, dur, hasSrc]);

  useEffect(() => {
    if (useHls) {
      const player = cloudinaryPlayerRef.current;
      if (!player || !hlsReady) return;
      if (muted || !active) player.mute();
      else player.unmute();
      const rate = playbackRate || (fastForwarding ? 2.0 : 1.0);
      if (videoRef.current) videoRef.current.playbackRate = rate;
      if (playing && active) {
        try {
          player.play();
        } catch {
          setPlaying(false);
        }
      } else {
        player.pause();
      }
      return;
    }

    const el = videoRef.current;
    if (!el || !hasSrc) return;
    // Force-mute and pause any non-active reel so audio never mixes across the
    // stacked <video> elements and only one plays at a time.
    el.muted = muted || !active;
    if (playing && active) {
      void el.play().catch(() => setPlaying(false));
    } else {
      el.pause();
    }
  }, [playing, muted, active, hasSrc, src, useHls, hlsReady, playbackRate, fastForwarding]);

  useEffect(() => {
    if (useHls) return;

    const el = videoRef.current;
    if (!el || !hasSrc) return;
    const rate = playbackRate || (fastForwarding ? 2.0 : 1.0);
    el.playbackRate = rate;
  }, [fastForwarding, hasSrc, playbackRate, useHls]);

  useEffect(() => {
    if (useHls) return;

    const el = videoRef.current;
    if (!el || !hasSrc) return;
    const onTime = () => setT(el.currentTime);
    const onMeta = () => setDur(el.duration || 18);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
    };
  }, [hasSrc, src, useHls]);

  const handlePointerDown = (e) => {
    if (!hasSrc) return;
    longPressTimer.current = setTimeout(() => {
      setFastForwarding(true);
      if (onLongPressStart) onLongPressStart();
    }, 300);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (fastForwarding) {
      setFastForwarding(false);
      if (onLongPressEnd) onLongPressEnd();
    }
  };

  const c = TINTS[tint] || TINTS.blue;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const togglePlay = () => setPlaying((p) => !p);
  const seekTo = (next) => {
    setT(next);
    if (useHls && cloudinaryPlayerRef.current) {
      cloudinaryPlayerRef.current.currentTime(next);
      return;
    }
    if (videoRef.current) videoRef.current.currentTime = next;
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        ...(fill ? { height: "100%" } : { aspectRatio: ratio }),
        borderRadius: radius,
        overflow: "hidden",
        background:
          thumb || src || streamPublicId ? "#000" : `linear-gradient(160deg, ${c[1]}, ${c[0]})`,
        cursor: "pointer",
        touchAction: "pan-y",
      }}
      onClick={togglePlay}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {fastForwarding && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "rgba(0,0,0,.6)",
            padding: "8px 16px",
            borderRadius: "var(--r-full)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            backdropFilter: "blur(4px)",
            pointerEvents: "none",
          }}
        >
          <Icon name="fastForward" size={16} color="#fff" />
          2x
        </div>
      )}
      {shouldAttachStream ? (
        <video
          ref={videoRef}
          src={useHls ? undefined : src || undefined}
          poster={thumb || undefined}
          playsInline
          loop
          muted={muted}
          preload="none"
          className={
            useHls ? (fill ? "cld-video-player" : "cld-video-player cld-fluid") : undefined
          }
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : thumb ? (
        <img
          src={thumb}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : hasSrc ? null : (
        <Icon
          name={icon}
          color={c[2]}
          stroke={1.3}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "46%",
            height: "46%",
            transform: `translate(-50%,-50%) scale(${playing ? 1.08 : 1})`,
            opacity: 0.5,
            transition: "transform 4s ease",
            animation: playing ? "bz-kenburns 8s ease-in-out infinite alternate" : "none",
          }}
        />
      )}
      {/* live tag */}
      {label !== false && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: "var(--red)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 800,
              padding: "4px 9px",
              borderRadius: "var(--r-sm)",
              letterSpacing: ".03em",
            }}
          >
            <Icon name="video" size={13} /> {label || "VIDEO"}
          </span>
        </div>
      )}
      {/* center play */}
      {!playing && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: compact ? 52 : 66,
              height: compact ? 52 : 66,
              borderRadius: "50%",
              background: "rgba(255,255,255,.92)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--sh-2)",
            }}
          >
            <Icon
              name="play"
              size={compact ? 22 : 28}
              color="var(--red)"
              fill="var(--red)"
              style={{ marginLeft: 3 }}
            />
          </div>
        </div>
      )}
      {/* product overlay */}
      {overlay}
      {/* controls */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "20px 12px 10px",
          background: "linear-gradient(transparent, rgba(11,18,32,.55))",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: "rgba(255,255,255,.35)",
            position: "relative",
            cursor: "pointer",
          }}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seekTo(((e.clientX - r.left) / r.width) * dur);
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${(t / dur) * 100}%`,
              background: "var(--blue)",
              borderRadius: 2,
            }}
          />
        </div>
        {!compact && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#fff" }}>
            <button
              aria-label={playing ? "Pause" : "Play"}
              onClick={() => setPlaying((p) => !p)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                padding: 0,
                display: "flex",
              }}
            >
              <Icon name={playing ? "pause" : "play"} size={18} fill="#fff" />
            </button>
            <button
              aria-label={muted ? "Unmute" : "Mute"}
              onClick={() => setMuted((m) => !m)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                padding: 0,
                display: "flex",
              }}
            >
              <Icon name={muted ? "mute" : "volume"} size={18} />
            </button>
            <span className="tnum" style={{ fontSize: 12, fontWeight: 600 }}>
              {fmt(t)} / {fmt(dur)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Skeleton card ---------- */
export function SkeletonCard() {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--line-200)",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
      }}
    >
      <div className="skel" style={{ aspectRatio: "1 / 1" }} />
      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="skel" style={{ height: 12, width: "85%", borderRadius: 4 }} />
        <div className="skel" style={{ height: 12, width: "55%", borderRadius: 4 }} />
        <div className="skel" style={{ height: 16, width: "40%", borderRadius: 4, marginTop: 4 }} />
      </div>
    </div>
  );
}

/* ---------- Empty state (mascot) ---------- */
// Shared empty-state. `dark` flips text colors for dark surfaces (e.g. Watch).
// Fixed spacing rhythm — image · 24 · title · 12 · message · 28 · button — so
// every empty page (Bargains, Orders, Watch) reads as the same component.
export function EmptyState({
  title,
  message,
  cta,
  onCta,
  ctaHref,
  secondary,
  onSecondary,
  secondaryHref,
  dark,
  icon,
}: {
  title: React.ReactNode;
  message?: React.ReactNode;
  cta?: React.ReactNode;
  onCta?: () => void;
  ctaHref?: string;
  secondary?: React.ReactNode;
  onSecondary?: () => void;
  secondaryHref?: string;
  dark?: boolean;
  /** When set, a soft icon tile replaces the illustration (enterprise empty state). */
  icon?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "48px 24px",
      }}
    >
      {icon ? (
        <span
          style={{
            width: 48,
            height: 48,
            borderRadius: "var(--r-lg)",
            background: "var(--tint-blue-50)",
            color: "var(--blue)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <Icon name={icon} size={24} color="var(--blue)" />
        </span>
      ) : (
        <img
          className="bz-emptystate-art"
          src={ASSETS.mascot}
          alt=""
          style={{ width: 150, height: "auto", objectFit: "contain", marginBottom: 24 }}
        />
      )}
      <h3
        style={{
          margin: 0,
          fontSize: "1.375rem",
          lineHeight: 1.27,
          fontWeight: 800,
          color: dark ? "#fff" : "var(--ink-900)",
        }}
      >
        {title}
      </h3>
      {message && (
        <p
          style={{
            margin: "12px 0 0",
            fontSize: "1rem",
            lineHeight: 1.5,
            color: dark ? "rgba(255,255,255,.72)" : "var(--ink-500)",
            maxWidth: 280,
          }}
        >
          {message}
        </p>
      )}
      <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
        {cta && (
          <Button variant="primary" size="md" onClick={onCta} href={ctaHref} iconRight="arrowRight">
            {cta}
          </Button>
        )}
        {secondary && (
          <Button variant="secondary" size="md" onClick={onSecondary} href={secondaryHref}>
            {secondary}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ---------- Quantity stepper ---------- */
export function QtyStepper({ value, onChange, min = 1, max = 99 }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: "1px solid var(--line-200)",
        borderRadius: "var(--r-md)",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={{
          width: 40,
          height: 40,
          border: "none",
          background: "#fff",
          cursor: value <= min ? "not-allowed" : "pointer",
          color: value <= min ? "var(--ink-300)" : "var(--ink-700)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="minus" size={16} />
      </button>
      <span
        className="tnum"
        style={{ width: 44, textAlign: "center", fontWeight: 700, fontSize: ".9375rem" }}
      >
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={{
          width: 40,
          height: 40,
          border: "none",
          background: "#fff",
          cursor: value >= max ? "not-allowed" : "pointer",
          color: value >= max ? "var(--ink-300)" : "var(--ink-700)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}

/* ---------- Toast ----------
   A compact navy pill that floats above the mobile tab bar (bottom-right on
   desktop). It acknowledges an action rather than announcing it: a small
   coloured check/error dot, a short message, and — for reversible actions like
   a wishlist save — an inline Undo. Tapping the body dismisses it; new toasts
   replace the current one rather than stacking. */
const TOAST_EXIT_MS = 320;

type ToastData = { msg: string; id: number; variant: string; undo?: () => void };

export function Toast({ toast }: { toast: ToastData | null }) {
  const [shown, setShown] = useState<ToastData | null>(null);
  const [leaving, setLeaving] = useState(false);
  const shownRef = useRef(shown);
  shownRef.current = shown;
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    if (!shownRef.current) return;
    setLeaving(true);
    if (exitTimer.current) clearTimeout(exitTimer.current);
    exitTimer.current = setTimeout(() => {
      setShown(null);
      setLeaving(false);
    }, TOAST_EXIT_MS);
  };

  useEffect(() => {
    if (toast) {
      if (exitTimer.current) clearTimeout(exitTimer.current);
      setShown(toast);
      setLeaving(false);
      return;
    }
    dismiss();
  }, [toast]);

  useEffect(() => () => void (exitTimer.current && clearTimeout(exitTimer.current)), []);

  if (!shown) return null;

  const variant = shown.variant ?? "success";
  const meta = TOAST_VARIANT_META[variant] ?? TOAST_VARIANT_META.success;
  const isError = variant === "error";

  return (
    <div className="bz-toast-wrap">
      <div
        key={shown.id}
        role={isError ? "alert" : "status"}
        aria-live={isError ? "assertive" : "polite"}
        className={`bz-toast bz-toast--${variant} ${leaving ? "bz-toast--exit" : "bz-toast--enter"}`}
        style={{ "--bz-toast-accent": meta.accent } as React.CSSProperties}
        onClick={dismiss}
      >
        <span className="bz-toast__dot" aria-hidden>
          <Icon name={meta.icon} size={11} color="#fff" stroke={2.4} />
        </span>
        <p className="bz-toast__msg">{shown.msg}</p>
        {shown.undo && (
          <button
            type="button"
            className="bz-toast__undo"
            aria-label="Undo save to wishlist"
            onClick={(e) => {
              e.stopPropagation();
              shown.undo?.();
            }}
          >
            Undo
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Section header with crimson stripe accent (brand pattern) ---------- */
export function SectionHead({
  eyebrow,
  title,
  accent,
  action,
  onAction,
  actionHref,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  accent?: React.ReactNode;
  action?: React.ReactNode;
  onAction?: () => void;
  actionHref?: string;
}) {
  return (
    <div
      className="bz-sec-head"
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginBottom: 16,
        gap: 16,
      }}
    >
      <div>
        {eyebrow && (
          <div
            className="bz-sec-head__eyebrow"
            style={{
              fontSize: ".75rem",
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--red)",
              marginBottom: 6,
            }}
          >
            {eyebrow}
          </div>
        )}
        <h2
          className="bz-sec-head__title"
          style={{
            margin: 0,
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "var(--blue-deep)",
            letterSpacing: "-.01em",
          }}
        >
          {title} {accent && <span style={{ color: "var(--red)" }}>{accent}</span>}
        </h2>
      </div>
      {action &&
        (actionHref ? (
          <AppLink
            href={actionHref}
            className="bz-sec-head__action"
            style={{
              color: "var(--blue)",
              fontWeight: 700,
              fontSize: ".9375rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
              textDecoration: "none",
            }}
          >
            {action} <Icon name="arrowRight" size={16} />
          </AppLink>
        ) : (
          <button
            onClick={onAction}
            className="bz-sec-head__action"
            style={{
              background: "none",
              border: "none",
              color: "var(--blue)",
              fontWeight: 700,
              fontSize: ".9375rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
            }}
          >
            {action} <Icon name="arrowRight" size={16} />
          </button>
        ))}
    </div>
  );
}

/* ---------- Pagination: load-more hook + button + page bar + back-to-top ----------
   Baymard/NN-g pattern for shopping lists: "Show N more" lazy-load beats both endless
   infinite scroll (users lose place, footer unreachable) and tiny numbered links (fat-finger,
   confusing for first-time buyers). Mobile = big tap button only. Desktop = button + a
   cosmetic numbered bar for users who want a sense of scale / direct jumps.
   CTA stays blue secondary — red is reserved for the one action per screen. */
export function usePaged(items, pageSize = 12, resetKey) {
  const [count, setCount] = useState(pageSize);
  // Reset to first page when the underlying list changes (e.g. filters applied).
  useEffect(() => {
    setCount(pageSize);
  }, [resetKey, pageSize]);
  const total = items.length;
  const shown = Math.min(count, total);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return {
    visible: items.slice(0, count),
    shown,
    total,
    pageSize,
    hasMore: count < total,
    nextBatch: Math.min(pageSize, Math.max(0, total - count)),
    page: total === 0 ? 1 : Math.max(1, Math.ceil(shown / pageSize)),
    pageCount,
    more: () => setCount((c) => c + pageSize),
    // Cosmetic-only in this prototype (no routing/SEO): jumping to page N reveals the
    // first N pages worth of items so the load-more window and the bar stay consistent.
    goPage: (n) => setCount(Math.min(Math.max(1, n), pageCount) * pageSize),
    reset: () => setCount(pageSize),
  };
}
/* Discrete numbered pages — for operational tables (seller orders / inventory) where
   users want control, exact page jumps, and to return to a known row. Replaces the slice
   each page (NOT cumulative like usePaged). Pairs with <PageBar>. */
export function usePages<T>(items: T[], perPage = 10, resetKey?: unknown) {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [resetKey, perPage]);
  const safe = Math.min(page, pageCount);
  const start = (safe - 1) * perPage;
  return {
    visible: items.slice(start, start + perPage),
    page: safe,
    pageCount,
    perPage,
    total,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + perPage, total),
    goPage: (n) => setPage(Math.min(Math.max(1, n), pageCount)),
  };
}
type LoadMorePaged = {
  visible: unknown[];
  shown: number;
  total: number;
  pageSize: number;
  hasMore: boolean;
  nextBatch: number;
  page: number;
  pageCount: number;
  more: () => void;
  goPage: (n: number) => void;
  reset: () => void;
};

type LoadMoreProps = {
  paged: LoadMorePaged | null | undefined;
  noun?: string;
  onTop?: () => void;
  onClear?: () => void;
  pageBar?: React.ReactNode;
  style?: React.CSSProperties;
  size?: string;
};

export function LoadMore({
  paged,
  noun = "products",
  onTop,
  onClear,
  pageBar,
  style,
  size = "lg",
}: LoadMoreProps) {
  if (!paged || paged.total === 0) return null;
  const { shown, total, hasMore, nextBatch, pageSize } = paged;
  // Everything fit on the first page — never paginated, so skip the end-state chrome.
  if (!hasMore && total <= pageSize) return null;
  const scrollTop = onTop || (() => window.scrollTo({ top: 0, behavior: "smooth" }));
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        marginTop: 32,
        ...style,
      }}
    >
      {hasMore ? (
        <>
          <Button
            variant="secondary"
            size={size}
            onClick={paged.more}
            iconRight="chevronDown"
            className={size === "sm" ? undefined : "bz-loadmore"}
          >
            Show {nextBatch} more {noun}
          </Button>
          <div
            className="tnum"
            style={{ fontSize: ".8125rem", color: "var(--ink-400)", fontWeight: 600 }}
          >
            Showing {shown} of {total} {noun}
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              fontSize: ".875rem",
              color: "var(--ink-500)",
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            You've seen all {total} {noun}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <Button variant="ghost" icon="chevronUp" onClick={scrollTop}>
              Back to top
            </Button>
            {onClear && (
              <Button variant="secondary" onClick={onClear}>
                Clear filters
              </Button>
            )}
          </div>
        </>
      )}
      {pageBar}
    </div>
  );
}
/* Cosmetic numbered bar (desktop control + sense of scale). Hidden on mobile by default. */
export function PageBar({
  page,
  pageCount,
  onPage,
  alwaysShow = false,
}: {
  page: number;
  pageCount: number;
  onPage: (n: number) => void;
  alwaysShow?: boolean;
}) {
  if (pageCount <= 1) return null;
  const nums = [];
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  const cell = (active, dim) => ({
    minWidth: 44,
    height: 44,
    padding: "0 12px",
    borderRadius: "var(--r-md)",
    border: `1.5px solid ${active ? "var(--blue-deep)" : "var(--line-200)"}`,
    background: active ? "var(--blue-deep)" : "#fff",
    color: active ? "#fff" : "var(--ink-700)",
    fontWeight: 700,
    fontSize: ".875rem",
    cursor: dim ? "not-allowed" : "pointer",
    opacity: dim ? 0.45 : 1,
    gap: 4,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  });
  return (
    <div
      className={alwaysShow ? "" : "bz-hide-mobile"}
      role="navigation"
      aria-label="Pagination"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: 16,
        flexWrap: "wrap",
      }}
    >
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} style={cell(false, page <= 1)}>
        <Icon name="chevronLeft" size={16} /> Previous
      </button>
      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} style={{ color: "var(--ink-400)", padding: "0 4px" }}>
            …
          </span>
        ) : (
          <button
            key={n}
            aria-current={n === page ? "page" : undefined}
            onClick={() => onPage(n)}
            style={cell(n === page, false)}
          >
            {n}
          </button>
        ),
      )}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= pageCount}
        style={cell(false, page >= pageCount)}
      >
        Next <Icon name="chevronRight" size={16} />
      </button>
    </div>
  );
}
/* Floating back-to-top — appears after scrolling, stacked ABOVE the green Help Lifeline FAB. */
export function BackToTop({ threshold = 1200 }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > threshold);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      title="Back to top"
      style={{
        position: "fixed",
        right: 22,
        bottom: 90,
        zIndex: 199,
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: "#fff",
        border: "1.5px solid var(--line-200)",
        boxShadow: "var(--sh-2)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--ink-900)",
      }}
    >
      <Icon name="chevronUp" size={22} />
    </button>
  );
}

/* ---------- All-in price card (guide §3.6) ---------- */
export function AllInPriceCard({ price, delivery = 60, area = "Chabahil", onEditArea }) {
  const total = price + delivery;
  return (
    <div
      style={{
        background: "var(--tint-blue-50)",
        border: "1.5px solid var(--blue)",
        borderRadius: "var(--r-md)",
        padding: 14,
        fontSize: ".875rem",
        color: "var(--ink-700)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 6,
          fontWeight: 700,
          color: "var(--blue-deep)",
        }}
      >
        <Icon name="truck" size={16} color="var(--blue-deep)" /> Delivered to{" "}
        <button
          onClick={onEditArea}
          style={{
            background: "none",
            border: "none",
            color: "var(--blue)",
            fontWeight: 700,
            textDecoration: "underline",
            cursor: "pointer",
            padding: 0,
            font: "inherit",
          }}
        >
          {area}
        </button>
      </div>
      <div className="tnum" style={{ fontSize: ".9375rem" }}>
        {formatNPR(price)} for item + {formatNPR(delivery)} delivery ={" "}
        <b style={{ color: "var(--blue-deep)" }}>{formatNPR(total)} to pay</b>
      </div>
    </div>
  );
}

/* ---------- OTP input ---------- */
export function OTPInput({ length = 4, onComplete }) {
  const [vals, setVals] = useState(Array(length).fill(""));
  const refs = useRef([]);
  const handle = (i, v) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...vals];
    next[i] = d;
    setVals(next);
    if (d && i < length - 1) refs.current[i + 1]?.focus();
    if (next.every((x) => x)) onComplete?.(next.join(""));
  };
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
      {vals.map((v, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={v}
          onChange={(e) => handle(i, e.target.value)}
          inputMode="numeric"
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          style={{
            width: 56,
            height: 56,
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: 700,
            border: `2px solid ${v ? "var(--blue)" : "var(--line-200)"}`,
            borderRadius: "var(--r-md)",
            fontFamily: "var(--font-sans)",
            outline: "none",
            color: "var(--ink-900)",
            background: "#fff",
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Menu row (profile, dropdown lists) ---------- */
export function MenuRow({ icon, label, sub, onClick, danger, badge, right, href }) {
  const Tag = href ? AppLink : "button";
  const tagProps = href ? { href, onNavigate: onClick } : { onClick };
  return (
    <Tag
      {...tagProps}
      className="bz-menu-row"
      style={{ color: danger ? "var(--danger)" : "var(--ink-900)", textDecoration: "none" }}
    >
      {icon && <Icon name={icon} size={20} color={danger ? "var(--danger)" : "var(--ink-700)"} />}
      <span style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: ".9375rem" }}>{label}</div>
        {sub && (
          <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 2 }}>{sub}</div>
        )}
      </span>
      {badge && (
        <Chip tone="red" size="sm">
          {badge}
        </Chip>
      )}
      {right || <Icon name="chevronRight" size={18} color="var(--ink-300)" />}
    </Tag>
  );
}

/* ---------- Sort chip group (guide §3.5 — older users miss dropdowns) ---------- */
export function ChipGroup({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          style={{
            height: "var(--chip-group-h, 40px)",
            padding: "0 var(--chip-group-px, 18px)",
            // Skinnable shape: Fluent seller uses a subtle 6px radius + hairline
            // border + denser sizing; buyer falls back to the full pill untouched.
            borderRadius: "var(--chip-radius, var(--r-full))",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "var(--chip-group-fs, .9375rem)",
            border: `var(--chip-border-w, 1.5px) solid ${value === o.value ? "var(--blue)" : "var(--line-200)"}`,
            background: value === o.value ? "var(--tint-blue-50)" : "#fff",
            color: value === o.value ? "var(--blue)" : "var(--ink-500)",
            whiteSpace: "nowrap",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- OptionChip — one selectable variant option ----------
   Shared by every variant picker (PDP colour/size groups, flat options, and the
   buy-now sheet) so selection looks identical everywhere: ONE selected-state
   treatment — filled blue tint + matching border + bolder text. Supports an
   optional swatch image, an `unavailable` state (no SKU backs it → disabled,
   dimmed) and a `soldOut` state (backed but out of stock → struck through with a
   "sold out" tag). Colour is never the only signal: sold-out also carries the
   strike-through and tag. */
export function OptionChip({
  label,
  selected = false,
  unavailable = false,
  soldOut = false,
  image,
  imageAlt,
  onImageClick,
  trailing,
  onClick,
}: {
  label: React.ReactNode;
  selected?: boolean;
  unavailable?: boolean;
  soldOut?: boolean;
  image?: string | null;
  imageAlt?: string;
  onImageClick?: () => void;
  trailing?: React.ReactNode;
  onClick?: () => void;
}) {
  const hasImg = Boolean(image);
  const fg = unavailable
    ? "var(--ink-300)"
    : selected
      ? "var(--blue)"
      : soldOut
        ? "var(--ink-400)"
        : "var(--ink-700)";
  return (
    <button
      type="button"
      disabled={unavailable}
      aria-pressed={selected}
      onClick={onClick}
      style={{
        display: "inline-flex",
        flexDirection: hasImg ? "column" : "row",
        alignItems: "center",
        gap: 6,
        minHeight: 44,
        padding: hasImg ? "8px 10px" : "0 16px",
        borderRadius: "var(--r-control)",
        cursor: unavailable ? "not-allowed" : "pointer",
        border: `1.5px solid ${selected ? "var(--blue)" : "var(--line-200)"}`,
        background: selected ? "var(--tint-blue-50)" : "#fff",
        color: fg,
        fontWeight: selected ? 700 : 500,
        fontSize: ".875rem",
        opacity: unavailable ? 0.45 : soldOut ? 0.7 : 1,
        position: "relative",
        whiteSpace: "nowrap",
      }}
    >
      {hasImg && (
        <img
          src={image!}
          alt={imageAlt ?? ""}
          onClick={
            onImageClick
              ? (e) => {
                  e.stopPropagation();
                  onImageClick();
                }
              : undefined
          }
          style={{
            width: 48,
            height: 48,
            objectFit: "cover",
            borderRadius: "var(--r-sm)",
            display: "block",
            filter: unavailable || soldOut ? "grayscale(1)" : "none",
            cursor: onImageClick ? "zoom-in" : undefined,
          }}
        />
      )}
      <span
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          gap: 6,
          textDecoration: soldOut ? "line-through" : "none",
        }}
      >
        {label}
        {trailing}
      </span>
      {soldOut && (
        <span
          style={{
            position: "absolute",
            bottom: -1,
            right: -1,
            fontSize: ".6rem",
            background: "var(--ink-300)",
            color: "#fff",
            padding: "1px 4px",
            borderRadius: "var(--r-sm)",
          }}
        >
          sold out
        </span>
      )}
    </button>
  );
}

/* ---------- Mobile sticky buy bar (guide §3.6) ---------- */
export function MobileBuyBar({
  onAdd,
  onBuy,
  onBargain,
  disabled = false,
}: {
  onAdd: () => void;
  onBuy: () => void;
  onBargain?: () => void;
  /** Out-of-stock listings disable the buy actions; bargaining is hidden too. */
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const showBargain = Boolean(onBargain) && !disabled;
  return (
    <div
      className="bz-mobile-only"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 90,
        background: "#fff",
        borderTop: "1px solid var(--line-200)",
        padding: "12px 14px calc(12px + env(safe-area-inset-bottom))",
        boxShadow: "0 -2px 12px rgba(15,23,42,.08)",
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
      }}
    >
      {/* Bargaining is BazaarCo's identity — leads the bar as a compact soft-red
          square, tinted so it never out-shouts Buy now. */}
      {showBargain ? (
        <button
          type="button"
          aria-label={t("pdp.makeOffer")}
          onClick={onBargain}
          className="bz-pdp-offer-btn"
          style={{
            flex: "0 0 auto",
            height: 46,
            padding: "0 12px",
            borderRadius: "var(--r-md)",
            color: "var(--red)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          <Icon name="bargain" size={18} />
          <span>Offer</span>
        </button>
      ) : null}
      {/* Add to cart — outlined navy, secondary to the solid Buy now. */}
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        style={{
          flex: 1,
          minWidth: 0,
          height: 46,
          borderRadius: "var(--r-md)",
          border: `1.5px solid ${disabled ? "var(--line-200)" : "var(--blue-deep)"}`,
          background: "#fff",
          color: disabled ? "var(--ink-300)" : "var(--blue-deep)",
          fontWeight: 600,
          fontSize: ".9375rem",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <Icon name="cart" size={18} /> {t("nav.cart")}
      </button>
      <Button
        variant="primary"
        icon="zap"
        onClick={onBuy}
        disabled={disabled}
        style={{
          flex: 1.4,
          minWidth: 0,
          height: 46,
          padding: "0 12px",
          fontSize: ".9375rem",
        }}
      >
        {disabled ? "Unavailable" : t("common.buyNow")}
      </Button>
    </div>
  );
}

/* ---------- Mobile bottom nav (guide §1) ---------- */
export function BottomNav({
  active,
  onNav,
  seller,
  cartCount = 0,
  avatarUrl,
}: {
  active: string | null;
  onNav: (screen: string) => void;
  seller?: boolean;
  cartCount?: number;
  avatarUrl?: string | null;
}) {
  const { t } = useTranslation();
  const buyerItems = [
    { id: "home", icon: "home", label: t("bottomNav.home") },
    { id: "bargains", icon: "bargain", label: t("bottomNav.bargain") },
    { id: "video", icon: "video", label: t("bottomNav.watch") },
    { id: "orders", icon: "package", label: t("bottomNav.orders") },
    { id: "profile", icon: "user", label: t("bottomNav.profile") },
  ];
  const sellerItems = [
    { id: "s-dashboard", icon: "home", label: t("bottomNav.home") },
    { id: "s-inbox", icon: "package", label: t("bottomNav.orders") },
    { id: "s-add", icon: "plus", label: t("bottomNav.add") },
    { id: "s-bargain", icon: "bargain", label: t("bottomNav.bargain") },
    { id: "__menu", icon: "menu", label: t("bottomNav.more") },
  ];
  const items = seller ? sellerItems : buyerItems;
  // Fall back to the user icon if the avatar image fails to load (e.g. an
  // expired/blocked Google photo) instead of showing a broken-image glyph.
  const [avatarFailed, setAvatarFailed] = useState(false);
  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);
  return (
    // The seller nav lives outside the seller shell, so it opts into the
    // Fluent skin itself — that re-points the accent/badge to blue and swaps
    // in Segoe UI to match the rest of the seller console.
    <nav
      className="bz-bnav"
      data-skin={seller ? "fluent" : undefined}
      aria-label={t("bottomNav.aria")}
    >
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => {
            if (it.id === "__menu") {
              window.dispatchEvent(new CustomEvent("bz-seller-menu"));
              return;
            }
            onNav(it.id);
          }}
          aria-current={active === it.id ? "page" : undefined}
          className={`bz-bnav__item${active === it.id ? " bz-bnav__item--active" : ""}`}
        >
          {it.id === "profile" && avatarUrl && !avatarFailed ? (
            <img
              src={avatarUrl}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                objectFit: "cover",
                border: active === it.id ? "2px solid var(--blue)" : "2px solid var(--line-200)",
              }}
            />
          ) : seller ? (
            // Fluent icons (filled when active) to match the seller sidebar.
            <SellerIcon name={it.icon} size={22} filled={active === it.id} />
          ) : (
            <Icon name={it.icon} size={22} />
          )}
          <span className="bz-bnav__label">{it.label}</span>
          {"badge" in it && it.badge > 0 ? (
            <span className="bz-bnav__badge tnum" aria-hidden>
              {it.badge > 9 ? "9+" : it.badge}
            </span>
          ) : null}
        </button>
      ))}
    </nav>
  );
}

/* ---------- Landmark address picker ---------- */
export function LandmarkAddress({ value, onChange }) {
  // Normalize per-field, not just when `value` is missing entirely: a partial
  // address (e.g. { city } with no area/landmark) must still yield defined
  // strings, or the inputs flip from controlled to uncontrolled.
  const v = { city: "", area: "", landmark: "", lat: null, lng: null, ...(value || {}) };
  const [mapOpen, setMapOpen] = useState(true);
  const [geoError, setGeoError] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const geoWatchRef = useRef(null);
  const geocodeTimerRef = useRef(null);
  const hasPin = typeof v.lat === "number" && typeof v.lng === "number";

  useEffect(() => {
    return () => {
      if (geoWatchRef.current != null) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
        geoWatchRef.current = null;
      }
      if (geocodeTimerRef.current) {
        clearTimeout(geocodeTimerRef.current);
      }
    };
  }, []);

  const vRef = useRef(v);
  vRef.current = v;

  const applyCoords = (lat, lng) => {
    const next = { ...vRef.current, lat, lng };
    vRef.current = next;
    onChange(next);
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    geocodeTimerRef.current = setTimeout(async () => {
      const place = await reverseGeocode(lat, lng);
      if (!place) return;
      const base = vRef.current;
      const merged = {
        ...base,
        lat,
        lng,
        city: place.city || base.city,
        area: place.area || base.area,
        landmark: base.landmark?.trim() ? base.landmark : place.landmark || base.landmark,
      };
      vRef.current = merged;
      onChange(merged);
    }, 400);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Your browser does not support location.");
      return;
    }
    setGeoError(null);
    setGeoLoading(true);
    setMapOpen(true);
    if (geoWatchRef.current != null) {
      navigator.geolocation.clearWatch(geoWatchRef.current);
    }
    geoWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGeoLoading(false);
        applyCoords(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setGeoLoading(false);
        setGeoError("Could not get your location. Allow location access or drop a pin manually.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  };
  const cities = [
    "Kathmandu",
    "Lalitpur",
    "Bhaktapur",
    "Pokhara",
    "Biratnagar",
    "Butwal",
    "Dharan",
    "Nepalgunj",
  ];
  const areas = {
    Kathmandu: [
      "Chabahil",
      "Baneshwor",
      "Maharajgunj",
      "Mahalaxmi",
      "Koteshwor",
      "Kalanki",
      "Sanepa",
      "Thamel",
    ],
    Lalitpur: ["Patan", "Jawalakhel", "Pulchowk", "Satdobato"],
    Bhaktapur: ["Suryabinayak", "Thimi", "Durbar Square area"],
    Pokhara: ["Lakeside", "Mahendrapool", "Chipledhunga", "Bagar"],
    Biratnagar: ["Main Road", "Bargachhi", "Hatkhola"],
    Butwal: ["Traffic Chowk", "Milan Chowk"],
    Dharan: ["Bhanu Chowk", "Putali Line"],
    Nepalgunj: ["Tribhuvan Chowk", "BP Chowk"],
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label
          style={{
            fontSize: ".75rem",
            fontWeight: 600,
            color: "var(--ink-600)",
            display: "block",
            marginBottom: 6,
          }}
        >
          City
        </label>
        <div style={{ position: "relative" }}>
          <Icon
            name="building"
            size={18}
            color="var(--ink-400)"
            style={{
              position: "absolute",
              left: 13,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <select
            value={v.city}
            onChange={(e) => {
              setGeoError(null);
              onChange({ ...v, city: e.target.value, area: "", lat: undefined, lng: undefined });
            }}
            style={{
              width: "100%",
              height: 48,
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-md)",
              padding: "0 14px 0 40px",
              fontSize: ".9375rem",
              fontFamily: "var(--font-sans)",
              background: "#fff",
              color: v.city ? "var(--ink-900)" : "var(--ink-400)",
            }}
          >
            <option value="">Select city…</option>
            {cities.map((c) => {
              const deliverable = isDeliverableCity(c);
              return (
                <option key={c} value={c} disabled={!deliverable}>
                  {deliverable ? c : `${c} — coming soon`}
                </option>
              );
            })}
          </select>
        </div>
        {v.city && !isDeliverableCity(v.city) && (
          <p
            role="alert"
            style={{
              margin: "8px 0 0",
              fontSize: ".8125rem",
              color: "var(--danger)",
              fontWeight: 600,
              lineHeight: 1.45,
            }}
          >
            {DELIVERY_AREA_MESSAGE}
          </p>
        )}
      </div>
      <div>
        <label
          style={{
            fontSize: ".75rem",
            fontWeight: 600,
            color: "var(--ink-600)",
            display: "block",
            marginBottom: 6,
          }}
        >
          Area / Ward
        </label>
        <div style={{ position: "relative" }}>
          <Icon
            name="mapPin"
            size={18}
            color="var(--ink-400)"
            style={{
              position: "absolute",
              left: 13,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <input
            list={v.city ? `bz-areas-${v.city}` : undefined}
            value={v.area}
            onChange={(e) => onChange({ ...v, area: e.target.value })}
            disabled={!v.city}
            placeholder={v.city ? "e.g. Mahalaxmi, Chabahil — or pick below" : "Select city first"}
            style={{
              width: "100%",
              height: 48,
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-md)",
              padding: "0 14px 0 40px",
              fontSize: ".9375rem",
              fontFamily: "var(--font-sans)",
              background: v.city ? "#fff" : "var(--line-100)",
            }}
          />
          {v.city && (
            <datalist id={`bz-areas-${v.city}`}>
              {(areas[v.city] || []).map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          )}
        </div>
      </div>
      <div>
        <label
          style={{
            fontSize: ".75rem",
            fontWeight: 600,
            color: "var(--ink-600)",
            display: "block",
            marginBottom: 6,
          }}
        >
          Landmark <span style={{ fontWeight: 400, color: "var(--ink-400)" }}>(optional)</span>
        </label>
        <div style={{ position: "relative" }}>
          <Icon
            name="flag"
            size={18}
            color="var(--ink-400)"
            style={{
              position: "absolute",
              left: 13,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <input
            value={v.landmark}
            onChange={(e) => onChange({ ...v, landmark: e.target.value })}
            placeholder='e.g. "Next to Bhatbhateni, opposite the petrol pump"'
            style={{
              width: "100%",
              height: 48,
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-md)",
              padding: "0 14px 0 40px",
              fontSize: ".9375rem",
              fontFamily: "var(--font-sans)",
              background: "#fff",
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={useMyLocation}
          disabled={geoLoading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 14px",
            background: "#fff",
            border: "1px solid var(--blue)",
            color: "var(--blue)",
            borderRadius: "var(--r-md)",
            cursor: geoLoading ? "wait" : "pointer",
            fontWeight: 600,
            fontSize: ".8125rem",
            fontFamily: "var(--font-sans)",
          }}
        >
          <Icon name="locate" size={16} />
          {geoLoading ? "Locating…" : "Use my location"}
        </button>
        <button
          type="button"
          onClick={() => {
            setGeoError(null);
            setMapOpen((open) => !open);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 4px",
            background: "transparent",
            border: "none",
            color: "var(--ink-500)",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: ".8125rem",
            fontFamily: "var(--font-sans)",
          }}
        >
          <Icon name={mapOpen ? "eyeOff" : "eye"} size={16} />
          {mapOpen ? "Hide map" : "Show map"}
        </button>
      </div>
      {geoError && (
        <p style={{ margin: 0, fontSize: ".75rem", color: "var(--danger)" }}>{geoError}</p>
      )}
      {hasPin && !mapOpen && (
        <p style={{ margin: 0, fontSize: ".75rem", color: "var(--success)", fontWeight: 600 }}>
          <Icon
            name="check"
            size={14}
            color="var(--success)"
            style={{ verticalAlign: "middle", marginRight: 4 }}
          />
          Pin saved ({v.lat.toFixed(5)}, {v.lng.toFixed(5)})
        </p>
      )}
      {mapOpen &&
        (v.city ? (
          <MapPinPicker
            city={v.city}
            lat={v.lat}
            lng={v.lng}
            onPick={(lat, lng) => applyCoords(lat, lng)}
          />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              height: 170,
              borderRadius: "var(--r-md)",
              border: "1px dashed var(--line-200)",
              background: "var(--line-100)",
              color: "var(--ink-400)",
              textAlign: "center",
              padding: "0 16px",
            }}
          >
            <Icon name="mapPin" size={22} color="var(--ink-400)" />
            <span style={{ fontSize: ".8125rem" }}>Select a city to load the map.</span>
          </div>
        ))}
    </div>
  );
}

/* ---------- Deliver-to modal (navbar) ---------- */
export function DeliverToModal({ open, value, onClose, onSave }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  if (!open) return null;

  const hasPin = typeof draft.lat === "number" && typeof draft.lng === "number";
  const canSave = !!(
    draft?.city?.trim() &&
    (draft?.area?.trim() || draft?.landmark?.trim() || hasPin)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="deliver-to-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 700,
        background: "rgba(11,18,32,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        className="fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "var(--r-xl)",
          width: "min(440px, 100%)",
          maxHeight: "min(90vh, 640px)",
          overflow: "auto",
          padding: "22px 24px 24px",
          boxShadow: "var(--sh-3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--r-md)",
              background: "var(--tint-red-50)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="mapPin" size={20} color="var(--red)" />
          </span>
          <div style={{ flex: 1 }}>
            <h2
              id="deliver-to-title"
              style={{
                margin: 0,
                fontSize: "1.125rem",
                fontWeight: 800,
                color: "var(--blue-deep)",
              }}
            >
              Deliver to
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: ".875rem",
                color: "var(--ink-500)",
                lineHeight: 1.45,
              }}
            >
              We use this for delivery fees and estimated arrival on product pages.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "var(--line-100)",
              border: "none",
              borderRadius: "var(--r-full)",
              width: 36,
              height: 36,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="x" size={18} color="var(--ink-500)" />
          </button>
        </div>

        <LandmarkAddress
          value={{
            city: draft.city,
            area: draft.area,
            landmark: draft.landmark ?? "",
            lat: draft.lat ?? null,
            lng: draft.lng ?? null,
          }}
          onChange={(addr) => {
            const postal = postalForCity(addr.city) || draft.postal;
            setDraft({ ...draft, ...addr, postal });
          }}
        />

        <div style={{ marginTop: 14 }}>
          <label
            style={{
              fontSize: ".8125rem",
              fontWeight: 600,
              color: "var(--ink-700)",
              display: "block",
              marginBottom: 6,
            }}
          >
            Postal code
          </label>
          <input
            value={draft.postal ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, postal: e.target.value.replace(/\D/g, "").slice(0, 5) })
            }
            placeholder="44600"
            inputMode="numeric"
            style={{
              width: "100%",
              height: 48,
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-md)",
              padding: "0 14px",
              fontSize: ".9375rem",
              fontFamily: "var(--font-sans)",
              background: "#fff",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <Button variant="ghost" full onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            full
            disabled={!canSave}
            onClick={() => canSave && onSave(draft)}
          >
            Save location
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Voice mic button ---------- */
export function VoiceMicButton({ onClick, size = 36 }) {
  return (
    <button
      onClick={onClick}
      aria-label="Voice search"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--red)",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        animation: "bz-mic-pulse 2.4s ease-in-out infinite",
        boxShadow: "0 2px 8px rgba(230,57,70,.4)",
      }}
    >
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        fill="#fff"
        aria-hidden="true"
      >
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path
          d="M5 11a7 7 0 0 0 14 0M12 18v3"
          stroke="#fff"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
