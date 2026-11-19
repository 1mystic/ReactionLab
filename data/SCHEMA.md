# Reaction record schema

Every reaction is one JSON object. Part files in `data/parts/*.json` are JSON **arrays** of these objects.
`tools/build-data.mjs` merges them into `data/reactions.js` (loaded by the site).

Chemistry is written in **mhchem** syntax (rendered by KaTeX + mhchem), WITHOUT the surrounding `\ce{}`
in the equation fields. In free-text fields you may embed inline chemistry as `$\ce{...}$`.
Remember: inside JSON every backslash must be doubled (`"$\\ce{CH3CHO}$"`).

```jsonc
{
  "id": "aldol-condensation",            // unique kebab-case
  "name": "Aldol Condensation",          // canonical name
  "aliases": ["Aldol reaction", "Aldol addition"],   // other accepted names / spellings
  "category": "Aldehydes & Ketones",     // EXACTLY one of the CATEGORIES below
  "kind": "Named reaction",              // EXACTLY one of the KINDS below
  "exam": ["JEE Main", "JEE Advanced"],  // subset of these two
  "difficulty": "easy",                  // easy | medium | hard
  "reactants": "2 CH3CHO",               // mhchem, left of the arrow
  "reagents": "dil. NaOH",               // mhchem, ABOVE the arrow (this is what gets hidden in quizzes)
  "conditions": "",                      // mhchem/text BELOW the arrow (temp, solvent...). "" if none
  "products": "CH3CH(OH)CH2CHO",         // mhchem, right of arrow (include by-products with +)
  "catalyst": "OH- (base catalysed)",    // plain text; "" if none
  "reagentKeywords": ["NaOH", "dilute alkali", "base"], // short tokens a student would write for reagent/catalyst/conditions (used for scoring)
  "productName": "3-Hydroxybutanal (aldol)",
  "summary": "Two molecules of an aldehyde/ketone with α-H combine in dilute base to give a β-hydroxy carbonyl.",
  "mechanism": "Short 2–4 sentence mechanism.",
  "keyPoints": ["Needs at least one α-H", "On heating dehydrates to α,β-unsaturated carbonyl"],
  "whenUsed": "When/where it is used (synthesis context / lab / industry).",
  "applications": ["Synthesis of crotonaldehyde", "C–C bond formation"],
  "examples": [
    { "eq": "2 CH3COCH3 ->[Ba(OH)2] (CH3)2C(OH)CH2COCH3", "note": "Diacetone alcohol" }
  ],                                      // eq = full mhchem equation (no \ce{})
  "jeeTips": "Common traps / exam pointers.",
  "reference": "https://www.organic-chemistry.org/namedreactions/aldol-addition.shtm", // or ""
  "tags": ["C–C bond formation", "carbonyl", "base"]
}
```

## CATEGORIES (use exactly)
- Hydrocarbons
- Aromatic Compounds
- Haloalkanes & Haloarenes
- Alcohols, Phenols & Ethers
- Aldehydes & Ketones
- Carboxylic Acids & Derivatives
- Amines & Diazonium Salts
- Biomolecules & Polymers
- Qualitative Tests

## KINDS (use exactly)
- Named reaction
- Rearrangement
- Oxidation
- Reduction
- Distinguishing test
- Industrial process
- General reaction

## mhchem tips (KaTeX)
- Arrow with reagent above / condition below: `A ->[reagent][condition] B`
- Text inside: `->[\text{dry ether}]` - plain words also OK in `\ce{}` but wrap multi-word phrases in `\text{}`
- Charges: `Ar-N2+ Cl-`, `OH-`, `Na+`. Bonds: `CH2=CH2`, `HC#CH` (triple), single bond `-`.
- Benzene ring: write `C6H5-` or `Ph-` (no drawings).
- Heat: `\Delta`. Degrees: `473 K` or `\pu{200 ^\circ C}`.
- Avoid `$` inside equation fields.
