# Reaction chain (multi-step) question schema

Files in `data/chains/*.json` are JSON arrays of chain objects. `tools/build-chains.mjs` validates them
(fields, KaTeX + mhchem rendering, option uniqueness) and writes `data/chains.js`.

A chain starts from one compound. Each step applies a reagent to the **product of the previous step**
and asks "what is obtained?". The student picks from 4 options (the product + 3 distractors).

Chemistry fields are **mhchem without `\ce{}`** (exactly like `data/parts/*.json`). In free text
(`explanation`) embed chemistry as `$\ce{...}$`. In JSON every backslash must be doubled.

```jsonc
{
  "id": "chain-ethanol-to-lactic-acid",     // unique kebab-case, prefix "chain-"
  "title": "Ethanol to lactic acid",         // shown only AFTER the chain is finished
  "chapters": ["Alcohols, Phenols & Ethers", "Aldehydes & Ketones", "Carboxylic Acids & Derivatives"], // 1-3 CATEGORIES
  "exam": ["JEE Main", "JEE Advanced"],      // subset
  "difficulty": "medium",                    // easy | medium | hard
  "start": "CH3CH2OH",                       // mhchem: starting compound
  "startName": "ethanol",
  "steps": [                                 // 2 to 5 steps
    {
      "reagent": "PCC, CH2Cl2",              // mhchem above the arrow (may include a second reactant, e.g. "CH3MgBr then H3O+")
      "conditions": "",                      // mhchem/text below the arrow, "" if none
      "product": "CH3CHO",                   // mhchem: the MAJOR product (becomes the next step's substrate)
      "productName": "ethanal",
      "distractors": ["CH3COOH", "CH2=CH2", "CH3CH2Cl"], // EXACTLY 3 plausible wrong products, all different from product
      "reaction": "Mild oxidation (PCC)",    // shown after answering
      "explanation": "PCC stops at the aldehyde; $\\ce{KMnO4}$ would over-oxidise to the acid."
    }
  ],
  "tags": ["oxidation", "cyanohydrin"]
}
```

## Rules
- Every product must be the textbook / NCERT / JEE-accepted MAJOR product. If regio- or stereochemistry
  matters, the product must show the correct one and a distractor should show the common wrong one.
- Distractors must be chemically meaningful traps (over-oxidation, wrong regiochemistry, other reagent's
  product, unreacted intermediate), never nonsense, and never equal to the product.
- The question text never names the reaction or the product before the student answers: do not put the
  product or the reaction name inside `reagent` or `conditions`.
- Use condensed formulas students can read (`C6H5COOH`, `CH3CH(OH)CN`). Avoid skeletal-only structures.
- No em dashes or en dashes anywhere; use commas, colons or hyphens.
- CATEGORIES: Hydrocarbons, Aromatic Compounds, Haloalkanes & Haloarenes, Alcohols, Phenols & Ethers,
  Aldehydes & Ketones, Carboxylic Acids & Derivatives, Amines & Diazonium Salts, Biomolecules, Polymers,
  Qualitative Tests.

Validate: `node tools/build-chains.mjs --check-only data/chains/<file>.json`
