import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import preact from "@preact/preset-vite";
import webExtension from "vite-plugin-web-extension";

const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
);

export default defineConfig({
  plugins: [
    preact(),
    webExtension({
      manifest: () => ({
        ...JSON.parse(
          readFileSync(new URL("./manifest.json", import.meta.url), "utf-8"),
        ),
        version,
      }),
      additionalInputs: ["src/content/intercept.ts"],
    }),
  ],
  build: {
    emptyOutDir: true,
  },
});
