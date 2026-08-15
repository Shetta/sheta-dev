import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { siteUrl } from '../lib/site';

export const GET: APIRoute = async ({ site }) => {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const pages: Array<{ loc: string; lastmod?: string }> = [
    { loc: siteUrl(site) },
    { loc: siteUrl(site, '/about/') },
    { loc: siteUrl(site, '/policies/') },
    { loc: siteUrl(site, '/posts/') },
    ...posts.map((post) => ({
      loc: siteUrl(site, `/posts/${post.id}/`),
      lastmod: (post.data.updated ?? post.data.published).toISOString().slice(0, 10)
    }))
  ];

  const entries = pages.map(({ loc, lastmod }) => [
    '  <url>',
    `    <loc>${loc}</loc>`,
    ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
    '  </url>'
  ].join('\n')).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    }
  });
};
