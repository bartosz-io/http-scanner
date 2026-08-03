import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const nonEmptyList = z.array(z.string().min(1)).min(1);

const headers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/headers' }),
  schema: z.object({
    headerName: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().min(80).max(180),
    applicability: z.enum(['response', 'request-and-response']),
    syntax: z.string().min(5),
    examples: nonEmptyList,
    useCases: nonEmptyList.min(2),
    commonMistakes: nonEmptyList.min(2),
    securityConsiderations: z.string().min(30),
    relatedHeaders: z.array(z.string()).min(1),
    references: z.array(z.object({
      label: z.string().min(3),
      url: z.url(),
    })).min(1),
  }),
});

export const collections = { headers };
