export const prerender = false;
import type { APIRoute } from 'astro';
import { guard, json, addressOf, siteUrl } from '../../../../../lib/wp-bridge';

// PLN-12: Postiz's connection check.
export const GET: APIRoute = ({ request, clientAddress }) =>
  guard(request, addressOf(request, clientAddress)) ??
  json({ id: 1, name: 'x-hakt', slug: 'x-hakt', avatar_urls: { '96': siteUrl('/mark.png') } });
