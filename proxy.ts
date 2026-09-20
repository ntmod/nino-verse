import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  if (pathname === '/dashboard' || pathname.startsWith('/note') || pathname.startsWith('/analytics') || pathname.startsWith('/settings')) {
    const sessionCookie = request.cookies.get('nori_session');
    const isLoggedIn = sessionCookie?.value === 'true';

    if (!isLoggedIn) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  if (pathname === '/login' && request.cookies.get('nori_session')?.value === 'true') {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
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

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/note/:path*',
    '/analytics/:path*',
    '/settings/:path*',
    '/login',
    '/api/nori/:path*',
  ],
};
