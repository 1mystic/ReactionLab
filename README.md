# ReactionLab — JEE Organic Reaction Bank

A fully static study site for organic chemistry reactions in Class 11–12 (NCERT), JEE Main, JEE Advanced and IISER IAT.

- **Dashboard** (`index.html`): stats, reaction of the day, chapter progress, recent attempts.
- **Practice** (`practice.html`): one click gives a random reaction with its reagent hidden. Type the name, reagent/catalyst and product. A fuzzy similarity score grades the answer (50% name, 35% reagent, 15% product/info). Hints cost 10 points each. **Reveal** shows answer cards: name, reagents, equation, mechanism, key points, when/where used, applications, examples and JEE tips.
- **MCQ quiz** (`practice.html?mode=mcq`): randomised 5–30 question quizzes. Question types are name-the-reaction, which-reaction (reagent hidden), pick-the-reagent and predict-the-product. Wrong options are look-alikes taken from the same chapter.
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

Opening `index.html` directly from disk also works. It deploys as-is to GitHub Pages, Netlify, Vercel or Firebase Hosting.

## Data

- `data/parts/*.json`: source of truth, one JSON array per chapter group. The format is documented in [`data/SCHEMA.md`](data/SCHEMA.md); chemistry is in mhchem syntax.
- `data/reactions.js`: generated bundle loaded by the pages. **Don't edit it by hand.**

After editing or adding part files:

```bash
npm install          # installs katex, used to validate every equation
npm run build:data   # validates schema + renders every mhchem string, then writes data/reactions.js
```

There are currently 290 reactions across 9 chapters. Records tagged `potential` are beyond-syllabus reactions that could plausibly appear in future papers. Records tagged `NCERT` / `IAT` mark syllabus relevance.

To fold user-added reactions back into the main bank: Edit & Upload → Saved data → **Custom reactions only**, save the file into `data/parts/`, then run `npm run build:data`.

## Storage

User data (attempts, custom reactions, edits, archive/blacklist) lives in `localStorage` under `reactionlab.v1`. All access goes through the `RL.storage` adapter in `assets/js/core.js` (`load`, `save`, `clear`). A Firebase Auth + Firestore adapter with the same interface can replace it later without touching page code.

## Structure

```
index.html  practice.html  bank.html  edit.html
assets/css/style.css        design system + responsive layout
assets/js/core.js           store, data access, chem rendering, similarity scoring, MCQ generator, layout
assets/js/{home,practice,bank,edit}.js
assets/vendor/              katex, mhchem, fuse.js, fonts
data/parts/*.json           reaction sources   ·   data/reactions.js (generated)
tools/build-data.mjs        validator + bundler
```
