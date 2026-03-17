import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { Resvg } from "@resvg/resvg-js";

const svg = readFileSync("src/icons/icon.svg", "utf-8");
const outDir = "public/icons";
mkdirSync(outDir, { recursive: true });

for (const size of [16, 48, 128]) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
  });
  const png = resvg.render().asPng();
  writeFileSync(`${outDir}/icon${size}.png`, png);
  console.log(`Generated icon${size}.png`);
}
