import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Handle nori sub-path protection (v1, legacy v1 paths, and v2)
  if (pathname.startsWith('/nori') || pathname.startsWith('/v1/nori') || pathname.startsWith('/v2/nori')) {
    const sessionCookie = request.cookies.get('nori_session');
    const isLoggedIn = sessionCookie?.value === 'true';

    const isLoginPath = pathname === '/nori/login' || pathname === '/v2/nori/login';
    const targetDashboard = pathname.startsWith('/v2/nori') ? '/v2/nori' : '/nori';
    const targetLogin = pathname.startsWith('/v2/nori') ? '/v2/nori/login' : '/nori/login';

    if (isLoginPath) {
      if (isLoggedIn) {
        url.pathname = targetDashboard;
        return NextResponse.redirect(url);
      }
    } else {
      if (!isLoggedIn) {
        url.pathname = targetLogin;
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