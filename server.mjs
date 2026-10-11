import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "site");
const PORT = process.env.PORT ? Number(process.env.PORT) : 5173;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

async function fileExists(p) {
  try {
    const s = await stat(p);
    return s.isFile();
  } catch {
    return false;
  }
}

async function resolveFile(pathname) {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const fromRoot = join(ROOT, safe);
  const candidates = [];
  if (safe === "/" || safe === "\\" || safe === "") {
    candidates.push(join(ROOT, "index.html"));
  } else {
    candidates.push(fromRoot);
    candidates.push(fromRoot + ".html");
    candidates.push(join(fromRoot, "index.html"));
  }
  for (const c of candidates) {
    if (await fileExists(c)) return c;
  }
  return join(ROOT, "index.html");
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const file = await resolveFile(url.pathname);
    const body = await readFile(file);
    const type = TYPES[extname(file).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "content-type": type, "cache-control": "no-cache" });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("Server error: " + err.message);
  }
});

server.listen(PORT, () => {
  console.log(`Shringar running at http://localhost:${PORT}`);
});
