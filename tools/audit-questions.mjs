#!/usr/bin/env node
// Audits generated questions for answer leaks. Usage: node tools/audit-questions.mjs [--verbose]
//  - MCQ: the stem/prompt must not contain the answer's key words; options must be unique.
//  - Free text: the reaction name is never shown, so only the hint/stem texts matter (checked via MCQ stems).
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const store = {};
const win = { localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => (store[k] = String(v)), removeItem: (k) => delete store[k] }, addEventListener() {} };
const ctx = vm.createContext({ window: win, localStorage: win.localStorage, document: { addEventListener() {}, documentElement: { classList: { add() {}, remove() {} } }, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({}) }, Blob: class {}, HTMLSelectElement: { prototype: {} }, console, requestAnimationFrame: () => {}, setTimeout, location: { search: '' }, navigator: {} });
vm.runInContext(fs.readFileSync(path.join(root, 'data/reactions.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/core.js'), 'utf8'), ctx);
const RL = ctx.window.RL;
const verbose = process.argv.includes('--verbose');

const strip = (h) => String(h).replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ');
const pool = RL.reactions({ include: 'active' });
const problems = []; let total = 0;
for (const r of pool) {
  for (const type of ['name', 'nameFromReagent', 'reagent', 'product']) {
    if (type === 'reagent' && !r.reagents) continue;
    total++;
    const q = RL.makeMCQ(r, pool, type);
    const where = `${r.id} [${type}]`;
    const shown = strip(q.stem) + ' ' + strip(q.prompt);
    if (type === 'reagent' || type === 'product') {
      const toks = RL.answerTokens(r, type);
      const hit = [...toks].filter((t) => new RegExp('(^|[^a-z0-9])' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)', 'i').test(strip(q.stem)));
      if (hit.length) problems.push(`${where}: stem reveals "${hit.join(', ')}"  <- ${strip(q.stem).trim()}`);
    }
    if (type === 'name' || type === 'nameFromReagent') {
      // the reaction name must not appear inside the displayed equation text
      if (shown.toLowerCase().includes(r.name.toLowerCase())) problems.push(`${where}: equation/stem contains the name`);
    }
    const texts = q.options.map((o) => strip(o.html).replace(/\s+/g, ' ').trim().toLowerCase());
    if (new Set(texts).size !== texts.length) problems.push(`${where}: duplicate options`);
    if (q.answer < 0 || q.options.length < 2) problems.push(`${where}: bad answer index / too few options`);
  }
}
const leakedNames = pool.filter((r) => RL.nameLeaks(r, 'reagent') || RL.nameLeaks(r, 'product'));
console.log(`${total} questions generated from ${pool.length} reactions`);
console.log(`${leakedNames.length} reactions have names that hint at reagent/product (stem falls back to generic wording)`);
if (verbose) leakedNames.forEach((r) => console.log('  - ' + r.name));
if (problems.length) { console.log(`\n${problems.length} problem(s):`); problems.forEach((p) => console.log(' - ' + p)); process.exit(1); }
console.log('No answer leaks found.');
