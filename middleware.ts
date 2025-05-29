import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

// This function can be marked `async` if using `await` inside
export default withAuth(
  // This function runs before each request, and we can modify the response
  function middleware(req) {
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
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!login|register|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
