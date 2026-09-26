export const prerender = false;
import type { APIRoute } from 'astro';
import { guard, json, addressOf, tags } from '../../../../lib/wp-bridge';

// PLN-12: tech tags already used on notes, with stable numeric ids.
export const GET: APIRoute = async ({ request, clientAddress }) =>
  guard(request, addressOf(request, clientAddress)) ?? json(await tags());
