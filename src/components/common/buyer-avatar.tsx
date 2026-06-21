"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import { userInitial } from "@/shared/lib/display";

type BuyerAvatarUser = {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

interface BuyerAvatarProps {
  user?: BuyerAvatarUser | null;
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
  fontSize?: number | string;
  border?: string;
  style?: CSSProperties;
}

export function BuyerAvatar({
  user,
  src,
  name,
  email,
  size = 32,
  fontSize = 13,
  border,
  style,
}: BuyerAvatarProps) {
  const imageUrl = src ?? user?.avatarUrl ?? null;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const label = name ?? user?.name ?? email ?? user?.email ?? "Account";
  const fallbackUser = user ?? { name, email };
  const showImage = Boolean(imageUrl && imageUrl !== failedSrc);

  useEffect(() => {
    setFailedSrc(null);
  }, [imageUrl]);

  return (
    <span
      aria-label={label}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        background: "var(--blue-deep)",
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize,
        flexShrink: 0,
        border,
        ...style,
      }}
    >
      {showImage ? (
        <img
          src={imageUrl ?? undefined}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(imageUrl)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        userInitial(fallbackUser)
      )}
    </span>
  );
}
