export const prerender = false;
import { site } from '../site';
export function GET() {
  return new Response('<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>' + site.url + '/sitemap.xml</loc></sitemap></sitemapindex>', { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
