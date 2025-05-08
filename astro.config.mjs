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

  integrations: [react()],

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
