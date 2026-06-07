import { createWriteStream, readFileSync, existsSync } from "fs";
import archiver from "archiver";

const { name, version } = JSON.parse(readFileSync("package.json", "utf-8"));

// Guard against zipping a stale build: dist/ is gitignored and only the build
// regenerates it, so a forgotten rebuild after `npm version` would ship the old
// version. vite.config.ts derives the manifest version from package.json, so any
// mismatch here means dist/ predates the current version.
if (!existsSync("dist/manifest.json")) {
  console.error("dist/ does not exist — run `npm run build` first");
  process.exit(1);
}
const distVersion = JSON.parse(readFileSync("dist/manifest.json", "utf-8")).version;
if (distVersion !== version) {
  console.error(
    `dist/ is stale: manifest.json is v${distVersion} but package.json is v${version} — run \`npm run build\` first`,
  );
  process.exit(1);
}

const filename = `${name}-v${version}.zip`;
const output = createWriteStream(filename);
const archive = archiver("zip", { zlib: { level: 9 } });

archive.pipe(output);
archive.directory("dist/", "StopYappingBro");
archive.finalize();

output.on("close", () => {
  console.log(`Created ${filename} (${archive.pointer()} bytes)`);
});
