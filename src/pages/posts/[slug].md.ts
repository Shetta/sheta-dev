import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';

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

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as any;
  const body = [
    '---',
    `title: ${yamlString(post.data.title)}`,
    `description: ${yamlString(post.data.description)}`,
    `published: ${post.data.published.toISOString()}`,
    ...(post.data.updated ? [`updated: ${post.data.updated.toISOString()}`] : []),
    `tags: ${JSON.stringify(post.data.tags)}`,
    `canonical: https://sheta.dev/posts/${post.id}`,
    '---',
    '',
    post.body.trim(),
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
