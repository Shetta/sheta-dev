import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    level: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
    series: z.string().optional(),
    prerequisites: z.array(z.string()).default([]),
    nextPost: z.string().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional()
  })
});

export const collections = { posts };
