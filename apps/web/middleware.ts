import type { NextRequestWithAuth } from 'next-auth/middleware';
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    try {
      const currentUrl = req.nextUrl.pathname;
      // const token = req.nextauth?.token;
      // redirect to dashboard if users are logged in, and don't show the landing page.
      // https://www.notion.so/191898ddd69e80fd8c56f436806cb16c?v=191898ddd69e8100b9bc000c8165b36a&p=1b9898ddd69e80b097ddfa4728f470fa&pm=s

      // IMPLEMENTED IN (protected)/layout.tsx
      // if (!token?.user?.accessToken) {
      //   return NextResponse.redirect(
      //     new URL('/error?error=NoAccessToken&callbackUrl=' + encodeURIComponent(req.url), req.url),
      //   );
      // }

      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-url', currentUrl);
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error('Token validation error:', error);
      return NextResponse.redirect(
        new URL(
          '/error?error=TokenValidationError&callbackUrl=' + encodeURIComponent(req.url),
          req.url,
        ),
      );
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Let the middleware function handle the authorization
        return true;
      },
    },
  },
);

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
};
