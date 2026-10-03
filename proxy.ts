import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { isWatchRoute, validWatchToken } from './lib/auth';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasCookie = !!getSessionCookie(request);
  if (pathname.startsWith('/api/nori/') && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const origin = request.headers.get('origin');
    if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  if ((pathname === '/onboarding' || pathname === '/dashboard' || pathname.startsWith('/note') || pathname.startsWith('/settings')) && !hasCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (pathname.startsWith('/api/nori/') && !['/api/nori/login', '/api/nori/logout', '/api/nori/auth-config'].includes(pathname)) {
    const watchAuthorized = isWatchRoute(request.method, pathname) && validWatchToken(request.headers.get('authorization'), process.env.WATCH_TOKEN_SHA256);
    if (!hasCookie && !watchAuthorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const incoming = new Headers(request.headers);
    incoming.delete('x-nori-watch-method');
    incoming.delete('x-nori-watch-path');
    if (watchAuthorized) {
      incoming.set('x-nori-watch-method', request.method);
      incoming.set('x-nori-watch-path', pathname);
    }
    return NextResponse.next({ request: { headers: incoming } });
  }
  return NextResponse.next();
}
export const config = { matcher: ['/onboarding', '/dashboard/:path*', '/note/:path*', '/settings/:path*', '/login', '/api/nori/:path*'] };
