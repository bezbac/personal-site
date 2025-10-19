// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import { createCssVariablesTheme } from "shiki/core";

import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

const cssVariableShikiTheme = createCssVariablesTheme({
  name: "css-variables",
  variablePrefix: "--shiki-",
  variableDefaults: {},
  fontStyle: true,
});

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
      theme: cssVariableShikiTheme,
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
