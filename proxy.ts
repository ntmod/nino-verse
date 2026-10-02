import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isWatchRoute, validSession, validWatchToken } from './lib/auth';

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  const isLoggedIn = validSession(request.cookies.get('nori_session')?.value, process.env.SESSION_SECRET);

  if (pathname === '/dashboard' || pathname.startsWith('/note') || pathname.startsWith('/settings')) {
    if (!isLoggedIn) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  if (pathname === '/login' && isLoggedIn) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Handle nori API protection
  if (pathname.startsWith('/api/nori/')) {
    if (pathname !== '/api/nori/login' && pathname !== '/api/nori/logout') {
      const watchAuthorized = isWatchRoute(request.method, pathname)
        && validWatchToken(request.headers.get('authorization'), process.env.WATCH_TOKEN_SHA256);
      if (!isLoggedIn && !watchAuthorized) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/note/:path*',
    '/settings/:path*',
    '/login',
    '/api/nori/:path*',
  ],
};
