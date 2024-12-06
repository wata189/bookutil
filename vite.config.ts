import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { quasar, transformAssetUrls } from "@quasar/vite-plugin";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  base: "./",

  plugins: [
    vue({
      template: { transformAssetUrls },
    }),

    quasar({
      sassVariables: "src/quasar-variables.sass",
    }),
  ],
  test: {
    globals: true,
    include: ["src/test.*.test.ts"],
    environment: "jsdom",
    coverage: {
      include: ["src/components/**/*.vue", "src/modules/**/*.ts"],
      reporter: ["text", "json", "html"],
    },
  },
  server: {
    host: true,
  },
} as unknown);
