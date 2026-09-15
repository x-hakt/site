import { defineMiddleware } from 'astro:middleware';
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  if (context.url.pathname === '/admin' || context.url.pathname.startsWith('/admin/')) {
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
});
