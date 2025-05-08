import { Resvg } from "@resvg/resvg-js";
import React from "react";
import satori from "satori";
import interFontDataUrl from "@fontsource/figtree/files/figtree-latin-400-normal.woff?url&inline";
import { dataUrlToArrayBuffer } from "./dataUrlToArrayBuffer";

const INTER = dataUrlToArrayBuffer(interFontDataUrl);

export async function renderSatoriImage(
  content: React.ReactNode,
  dimensions: { width: number; height: number },
) {
  const svg = await satori(content, {
    fonts: [
      {
        name: "Figtree",
        data: INTER,
      },
    ],
    height: dimensions.height,
    width: dimensions.width,
  });

  const image = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: dimensions.width,
    },
  })
    .render()
    .asPng();

  return image;
}
