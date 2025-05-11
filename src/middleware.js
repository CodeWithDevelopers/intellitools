import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const protectedPaths = ['/dashboard', '/profile', '/chat'];
const authPaths = ['/login', '/signup'];

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('token')?.value;

  // Check if path is protected
  const isProtectedPath = protectedPaths.some(pp => path.startsWith(pp));
  const isAuthPath = authPaths.some(ap => path.startsWith(ap));

  // If it's a protected path and no token exists, redirect to login
  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url);
    // Preserve the original path as the redirect parameter
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in and tries to access auth pages, redirect to dashboard
  if (isAuthPath && token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
      // Check if there's a redirect parameter
      const redirectTo = request.nextUrl.searchParams.get('redirect');
      // If there's a redirect parameter and it's a protected path, go there
      if (redirectTo && protectedPaths.some(pp => redirectTo.startsWith(pp))) {
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
      // Otherwise, go to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
      // If token is invalid, remove it and continue to auth page
      const response = NextResponse.next();
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
