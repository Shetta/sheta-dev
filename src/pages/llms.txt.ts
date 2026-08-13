import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());

  const body = [
    '# sheta.dev',
    '',
    '> Technical notes by Ahmed Sheta on software, distributed systems, data infrastructure, reliability, and experiments.',
    '',
    '## Retrieval',
    '',
    '- Human pages: https://sheta.dev/posts/<slug>',
    '- Markdown: https://sheta.dev/posts/<slug>.md',
    '- Content negotiation: send `Accept: text/markdown` to the human URL',
    '- Complete corpus: https://sheta.dev/llms-full.txt',
    '- RSS: https://sheta.dev/rss.xml',
    '',
    '## Posts',
    '',
    ...posts.map((post) => `- [${post.data.title}](https://sheta.dev/posts/${post.id}.md): ${post.data.description}`),
    ''
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    }
  });
};
