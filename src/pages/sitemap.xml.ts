import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const urls = [
    'https://sheta.dev/',
    'https://sheta.dev/about',
    'https://sheta.dev/posts',
    ...posts.map((post) => `https://sheta.dev/posts/${post.id}`),
    ...posts.map((post) => `https://sheta.dev/posts/${post.id}.md`)
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
