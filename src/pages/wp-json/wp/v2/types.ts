export const prerender = false;
import type { APIRoute } from 'astro';
import { guard, json, addressOf } from '../../../../lib/wp-bridge';

// PLN-12: one post type. Postiz posts to /wp-json/wp/v2/<rest_base>.
export const GET: APIRoute = ({ request, clientAddress }) =>
  guard(request, addressOf(request, clientAddress)) ??
  json({ notes: { name: 'Notes', slug: 'notes', rest_base: 'notes', description: 'Captain\'s log notes' } });
