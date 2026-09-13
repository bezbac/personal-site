// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import { createCssVariablesTheme } from "shiki/core";

import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

import { SITE_URL } from "./src/constants.ts";

const cssVariableShikiTheme = createCssVariablesTheme({
  name: "css-variables",
  variablePrefix: "--shiki-",
  variableDefaults: {},
  fontStyle: true,
});

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,

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

  image: {
    domains: ["covers.openlibrary.org", "archive.org"],
    remotePatterns: [{ hostname: "*.us.archive.org" }],
  },

  markdown: {
    shikiConfig: {
      theme: cssVariableShikiTheme,
    },
  },

  integrations: [react()],

  fonts: [
    {
      name: "Figtree",
      cssVariable: "--font-figtree",
      provider: fontProviders.google(),
    },
  ],
});
