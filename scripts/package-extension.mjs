import { createWriteStream, readFileSync } from "fs";
import archiver from "archiver";

const { name, version } = JSON.parse(readFileSync("package.json", "utf-8"));
const filename = `${name}-v${version}.zip`;
const output = createWriteStream(filename);
const archive = archiver("zip", { zlib: { level: 9 } });

archive.pipe(output);
archive.directory("dist/", "StopYappingBro");
archive.finalize();

output.on("close", () => {
  console.log(`Created ${filename} (${archive.pointer()} bytes)`);
});
