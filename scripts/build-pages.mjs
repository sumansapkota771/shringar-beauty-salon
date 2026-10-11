import { cpSync, rmSync, readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const BASE = (process.env.BASE || "/garibel-beauty-salon").replace(/\/+$/, "");
const SRC = "site";
const OUT = "_site";

rmSync(OUT, { recursive: true, force: true });
cpSync(SRC, OUT, { recursive: true });

function walk(dir) {
  let out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out = out.concat(walk(p));
    else out.push(p);
  }
  return out;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const BASE_RE = escapeRe(BASE.slice(1));

let changed = 0;
for (const file of walk(OUT)) {
  const ext = extname(file).toLowerCase();
  if (ext !== ".html" && ext !== ".js") continue;
  const before = readFileSync(file, "utf8");
  let s = before;

  if (ext === ".html") {
    s = s.split("/assets/").join(BASE + "/assets/");
    s = s.replace(
      new RegExp('(\\s(?:href|src)=")\\/(?!' + BASE_RE + ')', "g"),
      "$1" + BASE + "/"
    );
    s = s.split("/favicon.ico").join("/favicon.svg");
  } else {
    s = s.split("`/assets/").join("`" + BASE + "/assets/");
    s = s.split('"/assets/').join('"' + BASE + "/assets/");
    s = s.split("basepath:``").join("basepath:`" + BASE + "`");
    s = s.split("Zu=function(e){return`/`+e}").join("Zu=function(e){return`" + BASE + "/`+e}");
    s = s.split("href:`/`").join("href:`" + BASE + "/`");
    s = s.split("href:`/favicon.ico`,type:`image/x-icon`").join("href:`" + BASE + "/favicon.svg`,type:`image/svg+xml`");
  }

  if (s !== before) {
    writeFileSync(file, s);
    changed++;
  }
}

console.log(`Built ${OUT} for base path "${BASE}" (${changed} files rewritten)`);
