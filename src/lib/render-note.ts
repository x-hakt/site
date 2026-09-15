import { createHash } from 'node:crypto';
import { evaluate } from '@mdx-js/mdx';
import * as runtime from 'astro/jsx-runtime';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import renderer from '@astrojs/mdx/server.js';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import { rehypeHeadingIds, rehypeShiki } from '@astrojs/markdown-remark';
import NoteContent from '../components/NoteContent.astro';
import type { Note } from './notes';

// Only the site's existing component imports are needed. Other imports/exports
// get an explicit error instead of resolving arbitrary server modules.
function componentImports() {
  return (tree: any) => {
    tree.children = tree.children.filter((node: any) => {
      if (node.type !== 'mdxjsEsm') return true;
      for (const statement of node.data.estree.body) {
        const name = statement.specifiers?.[0]?.local?.name;
        if (statement.type !== 'ImportDeclaration' || statement.specifiers?.length !== 1 ||
            statement.specifiers[0].type !== 'ImportDefaultSpecifier' ||
            !['Figure', 'Term'].includes(name) ||
            statement.source.value !== '../../components/' + name + '.astro') {
          throw new Error('Notes support only the Figure and Term component imports.');
        }
      }
      return false;
    });
  };
}
const cache = new Map<string, Promise<string>>();
export async function renderNote(note: Note): Promise<string> {
  const key = createHash('sha256').update(note.raw).digest('hex');
  if (cache.has(key)) return cache.get(key)!;
  const pending = (async () => {
    const { default: Content } = await evaluate(note.body, {
      ...runtime, development: false, elementAttributeNameCase: 'html',
      remarkPlugins: [componentImports, remarkGfm, remarkSmartypants],
      rehypePlugins: [[rehypeShiki, { theme: 'github-dark-default', wrap: false }], rehypeHeadingIds],
    });
    const container = await AstroContainer.create();
    container.addServerRenderer({ name: 'astro:jsx', renderer });
    return container.renderToString(NoteContent, { props: { Content } });
  })();
  cache.set(key, pending);
  if (cache.size > 64) cache.delete(cache.keys().next().value!);
  try { return await pending; } catch (e) { cache.delete(key); throw e; }
}
