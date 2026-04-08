/**
 * GET /api/public/widget-logo/[...path] — Serve widget logo.
 *
 * Streams logo from data/widget/ directory.
 * Immutable cache (key changes on every upload).
 */

import { NextRequest } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";

const LOGO_DIR = path.join(process.cwd(), "data", "widget");
const SAFE_FILENAME = /^logo-[a-f0-9]+\.(svg|png|webp|jpg)$/;

const MIME_MAP: Record<string, string> = {
  svg: "image/svg+xml",
  png: "image/png",
  webp: "image/webp",
  jpg: "image/jpeg",
};

export async function GET(_request: NextRequest, { params }: { params: { path: string[] } }) {
  const filename = params.path.join("/");

  if (!SAFE_FILENAME.test(filename)) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(LOGO_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return new Response("Not found", { status: 404 });
  }

  const ext = filename.split(".").pop() || "png";
  const contentType = MIME_MAP[ext] || "application/octet-stream";
  const stat = fs.statSync(filePath);
  const stream = fs.createReadStream(filePath);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new Response(webStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(stat.size),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
