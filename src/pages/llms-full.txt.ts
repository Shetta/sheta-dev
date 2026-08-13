import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());

  const sections = posts.flatMap((post) => [
    `# ${post.data.title}`,
    '',
    `Canonical: https://sheta.dev/posts/${post.id}`,
    `Published: ${post.data.published.toISOString()}`,
    post.data.updated ? `Updated: ${post.data.updated.toISOString()}` : '',
    `Tags: ${post.data.tags.join(', ') || 'none'}`,
    '',
    post.body.trim(),
    '',
    '---',
    ''
  ]).filter(Boolean);

  return new Response(sections.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Signal': 'ai-train=yes, search=yes, ai-input=yes',
      'Cache-Control': 'public, max-age=300'
    }
  });
};
