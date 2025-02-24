// // middleware.ts
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// export function middleware(request: NextRequest) {
//   const requestHeaders = new Headers(request.headers);
//   const twitterSession = request.cookies.get("twitter_session")?.value;

//   // Add cache control headers to prevent caching for auth routes
//   if (request.nextUrl.pathname.startsWith("/api/auth/twitter")) {
//     requestHeaders.set(
//       "Cache-Control",
//       "no-store, no-cache, must-revalidate, proxy-revalidate"
//     );
//     requestHeaders.set("Pragma", "no-cache");
//     requestHeaders.set("Expires", "0");
//   }

//   // Check if current path is a protected route
//   const isProtectedRoute =
//     request.nextUrl.pathname.startsWith("/content") ||
//     request.nextUrl.pathname.startsWith("/knowledge") ||
//     request.nextUrl.pathname.startsWith("/members") ||
//     request.nextUrl.pathname.startsWith("/overview") ||
//     request.nextUrl.pathname.startsWith("/purgatory") ||
//     request.nextUrl.pathname.startsWith("/settings") ||
//     request.nextUrl.pathname.startsWith("/system-config") ||
//     request.nextUrl.pathname.startsWith("/team");

//   // Handle protected routes
//   if (!twitterSession && isProtectedRoute) {
//     // Store the current URL before redirecting
//     const response = NextResponse.redirect(
//       new URL("/auth/twitter", request.url)
//     );

//     // Save the original URL they were trying to access
//     response.cookies.set("returnUrl", request.url, {
//       path: "/",
//       httpOnly: true,
//       sameSite: "lax",
//     });

//     return response;
//   }

//   // Handle authentication routes
//   if (request.nextUrl.pathname.startsWith("/auth/twitter")) {
//     const response = NextResponse.next({
//       request: {
//         headers: requestHeaders,
//       },
//     });

//     // Add CORS headers for auth routes
//     if (request.nextUrl.pathname.startsWith("/api/auth/twitter")) {
//       response.headers.set("Access-Control-Allow-Credentials", "true");
//       response.headers.set(
//         "Access-Control-Allow-Origin",
//         process.env.NEXT_PUBLIC_BASE_URL || "*"
//       );
//       response.headers.set(
//         "Access-Control-Allow-Methods",
//         "GET,POST,PUT,DELETE,OPTIONS"
//       );
//       response.headers.set(
//         "Access-Control-Allow-Headers",
//         "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
//       );
//     }

//     return response;
//   }

//   // Default response for all other routes
//   return NextResponse.next({
//     request: {
//       headers: requestHeaders,
//     },
//   });
// }

// export const config = {
//   matcher: [
//     // Dashboard group routes
//     "/content/:path*",
//     "/knowledge/:path*",
//     "/members/:path*",
//     "/overview/:path*",
//     "/purgatory/:path*",
//     "/settings/:path*",
//     "/system-config/:path*",
//     "/team/:path*",
//     // Existing routes
//     "/auth/twitter",
//     "/api/auth/twitter/:path*",
//   ],
// };

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const twitterSession = request.cookies.get("twitter_session")?.value;
  // Add a new cookie check for onboarding status
  const onboardingComplete =
    request.cookies.get("onboarding_complete")?.value === "true";

  // Cache control headers logic remains the same
  if (request.nextUrl.pathname.startsWith("/api/auth/twitter")) {
    requestHeaders.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    requestHeaders.set("Pragma", "no-cache");
    requestHeaders.set("Expires", "0");
  }

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/content") ||
    request.nextUrl.pathname.startsWith("/knowledge") ||
    request.nextUrl.pathname.startsWith("/members") ||
    request.nextUrl.pathname.startsWith("/overview") ||
    request.nextUrl.pathname.startsWith("/purgatory") ||
    request.nextUrl.pathname.startsWith("/settings") ||
    request.nextUrl.pathname.startsWith("/system-config") ||
    request.nextUrl.pathname.startsWith("/team");

  // Skip onboarding check for these routes
  const isAuthOrOnboardingRoute =
    request.nextUrl.pathname.startsWith("/auth/twitter") ||
    request.nextUrl.pathname.startsWith("/onboarding");

  if (!isAuthOrOnboardingRoute) {
    // Handle authentication first
    if (!twitterSession && isProtectedRoute) {
      const response = NextResponse.redirect(
        new URL("/auth/twitter", request.url)
      );

      response.cookies.set("returnUrl", request.url, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });

      return response;
    }

    // Then handle onboarding for authenticated users
    if (twitterSession && !onboardingComplete && isProtectedRoute) {
      const response = NextResponse.redirect(
        new URL("/onboarding", request.url)
      );

      // Store return URL only if it's not already the onboarding page
      if (!request.url.includes("/onboarding")) {
        response.cookies.set("returnUrl", request.url, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
        });
      }

      return response;
    }
  }

  // Handle authentication routes
  if (request.nextUrl.pathname.startsWith("/auth/twitter")) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // CORS headers logic remains the same
    if (request.nextUrl.pathname.startsWith("/api/auth/twitter")) {
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set(
        "Access-Control-Allow-Origin",
        process.env.NEXT_PUBLIC_BASE_URL || "*"
      );
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,DELETE,OPTIONS"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
      );
    }

    return response;
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Update matcher to include onboarding route
export const config = {
  matcher: [
    // Dashboard group routes
    "/content/:path*",
    "/knowledge/:path*",
    "/members/:path*",
    "/overview/:path*",
    "/purgatory/:path*",
    "/settings/:path*",
    "/system-config/:path*",
    "/team/:path*",
    // Auth and onboarding routes
    "/auth/twitter",
    "/api/auth/twitter/:path*",
    "/onboarding/:path*",
  ],
};
