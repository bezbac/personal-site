// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [react()],

  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        name: "Figtree",
        cssVariable: "--font-figtree",
      },
      {
        provider: fontProviders.google(),
        name: "Fira Code",
        cssVariable: "--font-fira-code",
      },
    ],
  },
});
