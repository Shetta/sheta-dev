import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (char) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;'
  })[char]!);
}

export const GET: APIRoute = async () => {
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());

  const items = posts.map((post) => `
    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>https://sheta.dev/posts/${post.id}</link>
      <guid>https://sheta.dev/posts/${post.id}</guid>
      <pubDate>${post.data.published.toUTCString()}</pubDate>
      <description>${escapeXml(post.data.description)}</description>
    </item>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Ahmed Sheta</title>
    <link>https://sheta.dev</link>
    <description>Technical notes by Ahmed Sheta.</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
