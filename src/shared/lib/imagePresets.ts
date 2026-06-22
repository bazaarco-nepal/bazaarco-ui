export const IMAGE_PRESETS = {
  avatar: { aspect: 1, cropShape: "round", maxEdge: 512 },
  logo: { aspect: 1, cropShape: "rect", maxEdge: 512 },
  banner: { aspect: 16 / 5, cropShape: "rect", maxEdge: 1600 },
  product: { aspect: 1, cropShape: "rect", maxEdge: 1200 },
  reviewPhoto: { aspect: 1, cropShape: "rect", maxEdge: 1200 },
} as const;
