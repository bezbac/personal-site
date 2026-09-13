import rss, { type RSSFeedItem } from "@astrojs/rss";
import { getCollection, render } from "astro:content";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import type { APIContext } from "astro";
import { SITE_URL } from "../constants";

type BlogEntry = Awaited<ReturnType<typeof getCollection<"blog">>>[number];

function generateItems(
  posts: BlogEntry[],
  container: AstroContainer,
): Promise<RSSFeedItem[]> {
  return Promise.all(
    posts
      .toSorted(
        (a, b) => b.data.published.getTime() - a.data.published.getTime(),
      )
      .map((post) =>
        render(post)
          .then(({ Content }) => container.renderToString(Content))
          .then((content) => ({
            title: post.data.title,
            description: post.data.description,
            pubDate: post.data.published,
            link: `/blog/${post.id}/`,
            content,
          })),
      ),
  );
}

export function GET(context: APIContext) {
  return Promise.all([getCollection("blog"), AstroContainer.create()])
    .then(([posts, container]) => generateItems(posts, container))
    .then((items) =>
      rss({
        title: "Ben Bachem",
        description: "Hey there! I'm Ben. I build all kinds of digital things.",
        site: context.site ?? new URL(SITE_URL),
        items,
        customData: `<language>en</language>`,
      }),
    );
}
