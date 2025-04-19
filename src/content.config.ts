import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/data/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.date(),
    keywords: z.array(z.string()),
  }),
});

export const collections = { blog };
