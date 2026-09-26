export const prerender = false;
import type { APIRoute } from 'astro';
import { guard, json, addressOf, categories } from '../../../../lib/wp-bridge';

// PLN-12: the note tracks, as WordPress categories (ids 1..4, stable).
export const GET: APIRoute = ({ request, clientAddress }) =>
  guard(request, addressOf(request, clientAddress)) ?? json(categories());
