import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { siteUrl } from '../../lib/site';

export const getStaticPaths = (async () => {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post }
  }));
}) satisfies GetStaticPaths;

function yamlString(value: string) {
  return JSON.stringify(value);
}

export const GET: APIRoute = async ({ props, site }) => {
  const { post } = props as { post: CollectionEntry<'posts'> };
  const body = [
    '---',
    `title: ${yamlString(post.data.title)}`,
    `description: ${yamlString(post.data.description)}`,
    `published: ${post.data.published.toISOString()}`,
    ...(post.data.updated ? [`updated: ${post.data.updated.toISOString()}`] : []),
    `tags: ${JSON.stringify(post.data.tags)}`,
    `level: ${post.data.level}`,
    ...(post.data.series ? [`series: ${yamlString(post.data.series)}`] : []),
    `prerequisites: ${JSON.stringify(post.data.prerequisites)}`,
    ...(post.data.nextPost ? [`nextPost: ${post.data.nextPost}`] : []),
    `canonical: ${siteUrl(site, `/posts/${post.id}/`)}`,
    '---',
    '',
    post.body?.trim() ?? '',
    ''
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Signal': 'ai-train=yes, search=yes, ai-input=yes',
      'Cache-Control': 'public, max-age=300'
    }
  });
};
