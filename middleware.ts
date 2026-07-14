import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  // Set your desired username and a fallback password
  const USERNAME = 'admin'; 
  const PASSWORD = process.env.SITE_PASSWORD || 'change-this-secret-password';

  if (authHeader) {
    const authValue = authHeader.split(' ')[1];
    // Decode the browser's basic auth string
    const [user, pwd] = atob(authValue).split(':');

    if (user === USERNAME && pwd === PASSWORD) {
      const url = request.nextUrl.clone();
      const pathname = url.pathname;

      // Handle nori sub-path protection
      if (pathname.startsWith('/nori')) {
        const sessionCookie = request.cookies.get('nori_session');
        const isLoggedIn = sessionCookie?.value === 'true';

        if (pathname === '/nori/login') {
          if (isLoggedIn) {
            url.pathname = '/nori';
            return NextResponse.redirect(url);
          }
        } else {
          // Exclude any static/images or public paths if any, but since it's matches, redirect if not logged in
          if (!isLoggedIn) {
            url.pathname = '/nori/login';
            return NextResponse.redirect(url);
          }
        }
      }

      // Handle nori API protection
      if (pathname.startsWith('/api/nori/')) {
        if (pathname !== '/api/nori/login' && pathname !== '/api/nori/logout') {
          const sessionCookie = request.cookies.get('nori_session');
          if (sessionCookie?.value !== 'true') {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }
      }

      return NextResponse.next();
    }
  }

  // If credentials don't match or aren't present, force the browser login prompt
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Private Area"',
    },
  });
}

// This matcher ensures it protects every single page, API, and route, 
// while letting Next.js static assets and favicons load normally.
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};