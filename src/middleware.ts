import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Inside the iPhone app, skip the marketing home page and open the workspace.
  if (pathname === "/" && (req.headers.get("user-agent") ?? "").includes("FoundryApp")) {
    const url = req.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  // Fast redirect for signed-out visitors so /app links keep their destination.
  // The app layout still verifies the session against the database.
  if (pathname.startsWith("/app") && !req.cookies.get("foundry_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/", "/app/:path*"] };
