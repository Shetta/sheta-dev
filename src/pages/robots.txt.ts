import type { APIRoute } from 'astro';
import { siteUrl } from '../lib/site';

export const GET: APIRoute = ({ site }) => {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Content-Signal: search=yes, ai-train=no, use=reference',
    '',
    `Sitemap: ${siteUrl(site, '/sitemap.xml')}`,
    ''
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    }
  });
};
