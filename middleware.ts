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