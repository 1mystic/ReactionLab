#!/usr/bin/env node
// Stamps a content-hash build id into every HTML page:
//   - ?v=<id> on local css/js/data URLs (cache busting)
//   - <meta name="rl-build" content="<id>"> (lets a running tab notice that a newer deploy exists)
// The id only changes when css/js/data files change, so unchanged builds produce no diff.
// Runs automatically before `firebase deploy --only hosting`; run `npm run stamp` after editing assets.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['firebase-config.js', 'firebase-config.example.js']);
const files = [];
const walk = (dir, test) => { for (const f of fs.readdirSync(path.join(root, dir)).sort()) { const rel = `${dir}/${f}`; if (fs.statSync(path.join(root, rel)).isDirectory()) continue; if (test(f) && !SKIP.has(f)) files.push(rel); } };
walk('assets/js', (f) => f.endsWith('.js'));
walk('assets/css', (f) => f.endsWith('.css'));
walk('data', (f) => f.endsWith('.js'));
const h = crypto.createHash('sha1');
for (const f of files) { h.update(f); h.update(fs.readFileSync(path.join(root, f))); }
const id = h.digest('hex').slice(0, 10);

let changed = 0;
for (const page of fs.readdirSync(root).filter((f) => f.endsWith('.html'))) {
  const p = path.join(root, page);
  let s = fs.readFileSync(p, 'utf8'); const before = s;
  s = s.replace(/((?:assets|data)\/[^"'?]+\.(?:js|css))\?v=[0-9a-f]+/g, `$1?v=${id}`);
  if (page !== '404.html') {
    if (/<meta name="rl-build"/.test(s)) s = s.replace(/(<meta name="rl-build" content=")[^"]*(")/, `$1${id}$2`);
    else s = s.replace(/(<meta name="viewport"[^>]*>)/, `$1\n  <meta name="rl-build" content="${id}">`);
  }
  if (s !== before) { fs.writeFileSync(p, s); changed++; }
}
console.log(`stamp-build: ${id} (${files.length} files hashed, ${changed} page(s) updated)`);
