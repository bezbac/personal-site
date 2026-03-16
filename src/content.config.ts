import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// See: https://github.com/bluesky-social/atproto/blob/67eb0c19ac415e762e221b2ccda9f0bcf7b3dd6f/packages/syntax/src/aturi.ts#L22
const ATP_URI_REGEX =
  /^(at:\/\/)?((?:did:[a-z0-9:%-]+)|(?:[a-z0-9][a-z0-9.:-]*))(\/[^?#\s]*)?(\?[^#\s]+)?(#[^\s]+)?$/i;

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/data/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.date(),
    keywords: z.array(z.string()),
    atUri: z.optional(z.string().regex(ATP_URI_REGEX)),
  }),
});

export const collections = { blog };
