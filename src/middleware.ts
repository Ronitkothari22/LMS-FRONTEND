import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;

  // Debug information
  console.log(`Middleware processing path: ${path}`);
  console.log(`Cookies:`, {
    hasAccessToken: request.cookies.has('accessToken'),
    verificationPending: request.cookies.get('verificationPending')?.value,
    verificationEmail: request.cookies.get('verificationEmail')?.value,
  });

  // Get stored values from cookies
  const isAuthenticated = request.cookies.has('accessToken');
  const verificationPending = request.cookies.get('verificationPending')?.value;
  const verificationEmail = request.cookies.get('verificationEmail')?.value;

  // Public routes that don't need authentication
  const publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ];

  // API routes should always pass through
  if (path.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Static assets should always pass through
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/assets/') ||
    path.includes('.') // Files with extensions like .jpg, .css, etc.
  ) {
    return NextResponse.next();
  }

  // Verify email route protection
  if (path === '/verify-email') {
    // Allow access if verification is pending
    if (verificationPending && verificationEmail) {
      return NextResponse.next();
    }

    // If no verification is pending but user is authenticated, redirect to dashboard
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Otherwise redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Handle authentication for other routes
  if (isAuthenticated) {
    // If user is authenticated but needs verification
    if (verificationPending === 'true' && path !== '/verify-email') {
      console.log(
        'Redirecting to verify-email: User authenticated but needs verification'
      );
      return NextResponse.redirect(new URL('/verify-email', request.url));
    }

    // Redirect from public routes if already authenticated
    if (publicRoutes.includes(path)) {
      console.log(
        'Redirecting to dashboard: User is authenticated and trying to access public route'
      );
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Allow access to appropriate dashboard
    if (path === '/') {
      console.log(
        'Redirecting to dashboard: User is authenticated and accessing root'
      );
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Allow access to protected routes
    return NextResponse.next();
  } else {
    // If not authenticated, only allow access to public routes
    if (!publicRoutes.includes(path) && path !== '/') {
      console.log(
        'Redirecting to login: User is not authenticated and trying to access protected route'
      );
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Allow access to public routes
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets/images).*)'],
};
