import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from '../lib/site';

export const GET: APIRoute = async ({ site }) => {
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());
  const rootUrl = siteUrl(site).replace(/\/$/, '');

  const body = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    '## Retrieval',
    '',
    `- Human pages: ${rootUrl}/posts/<slug>/`,
    `- Markdown: ${rootUrl}/posts/<slug>.md`,
    '- Content negotiation: send `Accept: text/markdown` to the human URL',
    `- Complete corpus: ${siteUrl(site, '/llms-full.txt')}`,
    `- RSS: ${siteUrl(site, '/rss.xml')}`,
    '',
    '## Posts',
    '',
    ...posts.map((post) => `- [${post.data.title}](${siteUrl(site, `/posts/${post.id}.md`)}) [${post.data.level}]: ${post.data.description}`),
    ''
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    }
  });
};
