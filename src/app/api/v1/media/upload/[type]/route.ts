import { NextResponse } from "next/server";

import { env } from "@/config/env";

// Node runtime is required to stream the request body to the backend with
// `duplex: "half"`; the edge runtime can't proxy large multipart uploads.
export const runtime = "nodejs";
// Videos are large (backend caps at 100MB) — give the proxy room to finish.
export const maxDuration = 300;

const ALLOWED_TYPES = ["image", "video"] as const;
type UploadType = (typeof ALLOWED_TYPES)[number];

function isUploadType(value: string): value is UploadType {
  return (ALLOWED_TYPES as readonly string[]).includes(value);
}

/**
 * Same-origin proxy for seller media uploads. The browser sends this request to
 * the storefront origin, so the httpOnly `bazaarco_session` cookie rides along;
 * we forward that cookie (and any Bearer token) to the Core API so `requireAuth`
 * can authenticate. Uploading direct to the API host loses the cookie
 * cross-origin, which is what caused "Not authenticated".
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ type: string }> },
): Promise<Response> {
  const { type } = await params;
  if (!isUploadType(type)) {
    return NextResponse.json(
      { success: false, message: "Unsupported upload type", errors: [] },
      { status: 400 },
    );
  }

  const target = `${env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, "")}/api/v1/media/upload/${type}`;

  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");
  if (cookie) headers.set("cookie", cookie);
  if (authorization) headers.set("authorization", authorization);
  if (contentType) headers.set("content-type", contentType);

  try {
    const upstream = await fetch(target, {
      method: "POST",
      headers,
      body: request.body,
      // Stream the body instead of buffering the whole file in memory.
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch (error) {
    console.error(`[media-upload-proxy] ${type} upload failed`, error);
    return NextResponse.json(
      { success: false, message: "Upload failed", errors: [] },
      { status: 502 },
    );
  }
}
