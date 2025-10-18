// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],

    ssr: {
      external: ["@resvg/resvg-js"],
    },

    build: {
      rollupOptions: {
        external: ["@resvg/resvg-js"],
      },
    },

    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },

  markdown: {
    shikiConfig: {
      themes: {
        light: "gruvbox-light-medium",
        dark: "gruvbox-dark-medium",
      },
    },
  },

  integrations: [react()],

  image: {
    domains: ["covers.openlibrary.org"],
  },

  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        name: "Figtree",
        cssVariable: "--font-figtree",
      },
    ],
  },
});
