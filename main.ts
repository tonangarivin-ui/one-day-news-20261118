import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const image = join(here, "entry.png");
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

try {
  const info = await stat(image);
  if (!info.isFile()) throw new Error("entry.png is not a file");
  if (info.size > 1024 * 1024) throw new Error("entry.png exceeds the 1 MiB limit");

  const bytes = await readFile(image);
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!png && !jpeg) throw new Error("entry.png is neither a PNG nor a JPEG");

  await mkdir(outputDir, { recursive: true });
  await copyFile(image, join(outputDir, "entry.png"));
  console.log(`Wrote ${bytes.length} bytes to ${join(outputDir, "entry.png")}`);
} catch (error) {
  const message = error instanceof Error && "code" in error && error.code === "ENOENT"
    ? "entry.png is missing"
    : error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
}
