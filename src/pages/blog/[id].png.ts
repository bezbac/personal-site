import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import OgImage from "../../components/OgImage";
import React from "react";
import { renderSatoriImage } from "../../fns/renderSatoriImage";

interface Props {
  title: string;
}

export async function GET(context: APIContext<Props>) {
  const { title } = context.props;

  const image = await renderSatoriImage(
    React.createElement(OgImage, { title }),
    {
      width: 1200,
      height: 630,
    },
  );

  return new Response(image, {
    headers: {
      "Content-Type": "image/png",
    },
  });
}

export async function getStaticPaths() {
  const posts = await getCollection("blog");

  const paths = posts.map((post) => {
    return {
      params: {
        id: post.id,
      },
      props: {
        title: post.data.title,
      },
    };
  });

  return paths;
}
