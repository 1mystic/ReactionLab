# ReactionLab - JEE Organic Reaction Bank

A fully static study site for organic chemistry reactions in Class 11–12 (NCERT), JEE Main, JEE Advanced and IISER IAT.

- **Sign-in** (`index.html`): minimal landing page with Google sign-in (Firebase Auth). Every app page requires sign-in.
- **Dashboard** (`dashboard.html`): stats, reaction of the day, chapter progress, recent attempts.
- **Practice** (`practice.html`): one click gives a random reaction with its reagent hidden. Type the name, reagent/catalyst and product. A fuzzy similarity score grades the answer (50% name, 35% reagent, 15% product/info). Hints cost 10 points each. **Reveal** shows answer cards: name, reagents, equation, mechanism, key points, when/where used, applications, examples and JEE tips.
- **MCQ quiz** (`practice.html?mode=mcq`): randomised 5–30 question quizzes. Question types are name-the-reaction, which-reaction (reagent hidden), pick-the-reagent and predict-the-product. Wrong options are look-alikes taken from the same chapter.
- **Reaction chains** (`practice.html?mode=chain`): multi-step questions. Start from a compound, apply reagent X, pick the product, then treat that product with reagent Y, and so on (2 to 5 steps, 4 options each). Sources in `data/chains/*.json` (format in [`data/chains/SCHEMA.md`](data/chains/SCHEMA.md)), built with `node tools/build-chains.mjs` into `data/chains.js`.
- **GOC Concept Lab** (`goc.html`): JEE-style General Organic Chemistry questions in four types:
  - **Arrange in order**: tap items into order; partial credit for correctly ordered pairs
  - **Compare**: pick the stronger or more stable species
  - **Effect of substituent**: adding X at o/m/p, does acidity/basicity/stability go up or down?
  - **Single-correct MCQ**

  Topics: carbocation/carbanion/radical/alkene stability, resonance, hyperconjugation, inductive effect, aromaticity, acidity, basicity, o/m/p substituent effects, tautomerism, physical properties, nucleophilicity, leaving groups, carbonyl reactivity, SN1/SN2/E1/E2, EAS and migratory aptitude. 194 curated questions, plus unlimited **generated** questions built from experimental pKa data (substituted phenols, benzoic acids, anilinium ions) and a textbook table for benzyl cations/anions. Practice and timed-quiz modes; topic accuracy is tracked.
- **Reaction bank** (`bank.html`): grid, list or chapter-stack views. Fuzzy search (Fuse.js) plus chapter, type, exam and difficulty filters.
- **Edit & Upload** (`edit.html`):
  - archive or blacklist reactions
  - edit built-ins (revertible)
  - add reactions with live preview and image upload
  - import JSON written by any LLM using the built-in copy-paste prompt
  - **Saved data**: export, import (merge/replace) or delete all local data

Keyboard: `N` next · `R` reveal · `H` hint · `Ctrl+Enter` check · `A–D` / `1–4` answer MCQ · `/` search the bank.

## Run

No build step. Libraries (KaTeX + mhchem, Fuse.js, Plus Jakarta Sans) are vendored in `assets/vendor/`, so the site works offline.

```bash
python3 -m http.server 8080   # then open http://localhost:8080
```

Google sign-in needs an http(s) origin that is authorised in Firebase Auth (`localhost`, `reactionlab-25f61.web.app`, `reactionlab-25f61.firebaseapp.com`), so serve locally over http instead of opening files from disk.

## Deploy (Firebase Hosting + Firestore)

Live site: https://reactionlab-25f61.web.app

```bash
firebase deploy --only hosting            # site
firebase deploy --only firestore          # security rules + indexes
```

**Firebase web config is not in git.** Put the web config from the Firebase console (Project settings > Your apps) in a local, git-ignored `.env`; `tools/write-firebase-config.mjs` turns it into `assets/js/firebase-config.js` (also git-ignored) before every hosting deploy, or run `npm run config` for local dev. See `assets/js/firebase-config.example.js`. Restrict the web API key to your domains in Google Cloud console > APIs & Services > Credentials.

`firebase.json` serves the repo root, ignores tooling and raw data (`tools/`, `data/parts/`, `data/goc/`, docs), sends `no-cache` for HTML/JS/CSS so a deploy never mixes old and new files, and uses `404.html` as the custom error page.

## Data

- `data/parts/*.json`: source of truth, one JSON array per chapter group. The format is documented in [`data/SCHEMA.md`](data/SCHEMA.md); chemistry is in mhchem syntax.
- `data/reactions.js`: generated bundle loaded by the pages. **Don't edit it by hand.**

After editing or adding part files:

```bash
npm install          # installs katex, used to validate every equation
npm run build:data   # validates schema + renders every mhchem string, then writes data/reactions.js
```

GOC questions live in `data/goc/*.json` (format in [`data/goc/SCHEMA.md`](data/goc/SCHEMA.md)). Build them with `npm run build:goc`, which writes `data/goc.js`. The pKa-driven generator is `assets/js/goc-gen.js`.

There are currently 290 reactions across 9 chapters. Records tagged `potential` are beyond-syllabus reactions that could plausibly appear in future papers. Records tagged `NCERT` / `IAT` mark syllabus relevance.

To fold user-added reactions back into the main bank: Edit & Upload → Saved data → **Custom reactions only**, save the file into `data/parts/`, then run `npm run build:data`.

## Storage

User data is saved per Google account in Firestore (free Spark plan), by `assets/js/cloud.js`:

| Document | Contents |
|---|---|
| `users/{uid}` | account info, name, content filters, archive/blacklist |
| `users/{uid}/data/progress` | practice attempts, GOC attempts |
| `users/{uid}/data/content` | custom reactions, edits to built-in reactions |

**Instant page switches.** `assets/js/router.js` is a small client-side router: links between app pages fetch the next page, keep the sidebar mounted and swap only `<main>` with a short fade/rise (each page is still a complete HTML document, so deep links and refresh work; any problem falls back to a normal page load). Page scripts register global listeners with `RL.listen` so `RL.pageCleanup()` can remove them on navigation. Long equation lists render lazily (`RL.lazyEquations`). `tools/stamp-build.mjs` writes a content-hash build id (`?v=` on assets and `<meta name="rl-build">`); a tab that notices a newer build in the next page does a normal load, so a deploy reaches open tabs on their next click. The stamp runs before every hosting deploy (`npm run stamp` to run it by hand).

**Sync is a merge, never a blind overwrite.** Pages start instantly from the local copy and sync in the background (the first visit on a device waits for the cloud once). For each document the app remembers what the cloud held at the last sync and does a three-way merge: only-local changes are pushed, only-cloud changes (another device) are taken, and if both changed the practice history is merged (union). A cloud document that does not exist yet never blanks local data, and nothing is written unless the cloud copy could be merged first.

A per-account copy in `localStorage` keeps pages instant and usable offline; changes are written to Firestore a few seconds after they happen (and on page hide), and unsynced offline changes are pushed on the next visit. Progress made before the first sign-in on a browser is moved into the account once. `firestore.rules` lets each user read and write only their own documents, with schema and size checks. Pages start through `RL.boot(fn)`, which waits for the signed-in user's data.

## Structure

```
index.html (sign-in)  dashboard.html  practice.html  goc.html  bank.html  edit.html  settings.html  404.html
assets/js/firebase.js       Firebase SDK setup (Auth + Firestore), small `fb` wrapper
assets/js/cloud.js          sign-in gate + Firestore sync      ·   assets/js/landing.js (sign-in page)
firebase.json  firestore.rules  firestore.indexes.json  .firebaserc
assets/css/style.css        design system + responsive layout
assets/js/core.js           store, data access, chem rendering, similarity scoring, MCQ generator, layout
assets/js/{home,practice,goc,goc-gen,bank,edit}.js
assets/vendor/              katex, mhchem, fuse.js, fonts
data/parts/*.json           reaction sources   ·   data/reactions.js (generated)
data/goc/*.json             GOC questions      ·   data/goc.js (generated)
tools/build-data.mjs        reaction validator + bundler
tools/build-goc.mjs         GOC validator + bundler
```
