import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const BASE = (process.env.BASE || "/shringar-beauty-salon").replace(/\/+$/, "");
const ROOT = "_site";
const PORT = process.env.PORT ? Number(process.env.PORT) : 5174;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

async function isFile(p) {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

async function resolve(pathname) {
  let rel = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  rel = normalize(decodeURIComponent(rel)).replace(/^(\.\.[/\\])+/, "");
  if (rel === "/" || rel === "\\" || rel === "") return join(ROOT, "index.html");
  const fromRoot = join(ROOT, rel);
  for (const c of [fromRoot, fromRoot + ".html", join(fromRoot, "index.html")]) {
    if (await isFile(c)) return c;
  }
  return join(ROOT, rel); // 404
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (!url.pathname.startsWith(BASE)) {
    res.writeHead(302, { location: BASE + "/" });
    return res.end();
  }
  const file = await resolve(url.pathname);
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file).toLowerCase()] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
  }
});

server.listen(PORT, () => console.log(`Pages preview: http://localhost:${PORT}${BASE}/`));
