import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

// This function can be marked `async` if using `await` inside
export default withAuth(
  // This function runs before each request, and we can modify the response
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // User must be approved to access any protected routes
    if (token && !token.isApproved) {
      return new NextResponse(
        JSON.stringify({ error: 'Your account is pending approval' }),
        {
          status: 403,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    // Admin only paths
    if (path.startsWith('/admin')) {
      if (token?.role !== 'admin') {
        return new NextResponse(
          JSON.stringify({ error: 'Admin access required' }),
          {
            status: 403,
            headers: { 'content-type': 'application/json' },
          }
        );
      }
    }

    // Return NextResponse.next() to allow the request through
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // If there is a token, the user is authorized
    },
    pages: {
      signIn: '/login',
    },
  }
);

// Protect all routes except authentication-related ones
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - login
     * - register
     * - api/auth (NextAuth routes)
     * - api/assets (public assets endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!login|register|api/auth|api/assets|_next/static|_next/image|favicon.ico|inkventory-logo.png|inkventory-icon.png|file.svg|globe.svg|next.svg|vercel.svg|window.svg).*)',
  ],
};
