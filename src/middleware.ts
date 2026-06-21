import { NextResponse, type NextRequest } from "next/server";

/* Level 1 — intentional global maintenance. When NEXT_PUBLIC_MAINTENANCE_MODE
   is "true" (set for scheduled upgrades), every buyer request is rewritten to
   the /maintenance page. We REWRITE (not redirect) so the URL stays put and a
   Refresh just re-hits the gate — no reload loop. A ?bypass=<token> query sets a
   cookie so an admin can verify the site before flipping the flag off. */

const BYPASS_COOKIE = "bz_maint_bypass";

export function middleware(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE !== "true") {
    return NextResponse.next();
  }

  const { pathname, searchParams } = req.nextUrl;
  const bypassToken = process.env.MAINTENANCE_BYPASS_TOKEN;

  // Bypass: already-bypassed session, or a fresh ?bypass=<token> that matches.
  if (req.cookies.get(BYPASS_COOKIE)) {
    return NextResponse.next();
  }
  if (bypassToken && searchParams.get("bypass") === bypassToken) {
    const res = NextResponse.next();
    res.cookies.set(BYPASS_COOKIE, "1", { path: "/", httpOnly: true, sameSite: "lax" });
    return res;
  }

  // Let the maintenance page itself render (prevents an infinite rewrite loop).
  if (pathname === "/maintenance") {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/maintenance";
  return NextResponse.rewrite(url);
}

export const config = {
  // Match everything EXCEPT Next internals, the /api proxy, and static assets,
  // so the maintenance page renders fully styled and a bypassed admin keeps API.
  matcher: [
    "/((?!_next/static|_next/image|api/|favicon.ico|manifest.webmanifest|icons/|images/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?)).*)",
  ],
};
