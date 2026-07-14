import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
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

// This matcher ensures it protects every single page, API, and route, 
// while letting Next.js static assets and favicons load normally.
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};