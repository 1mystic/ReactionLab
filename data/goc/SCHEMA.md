# GOC concept question schema

Files in `data/goc/*.json` are JSON arrays of question objects. `tools/build-goc.mjs` validates them and writes `data/goc.js`.
Display text (question, items, options, explanation) is plain text with optional inline chemistry `$\ce{...}$`
(KaTeX + mhchem). In JSON, double every backslash: `"$\\ce{CH3-CH2+}$"`.

```jsonc
{
  "id": "goc-cation-001",                 // unique kebab-case
  "topic": "Carbocation stability",        // EXACTLY one of TOPICS below
  "type": "order",                         // order | compare | effect | mcq
  "difficulty": "medium",                  // easy | medium | hard
  "exam": ["JEE Main", "JEE Advanced"],
  "question": "Arrange the following carbocations",   // the stem
  "criterion": "decreasing order of stability",       // ORDER only: what to sort by (shown as "Arrange in <criterion>")
  "items": ["$\\ce{(CH3)3C+}$", "$\\ce{(CH3)2CH+}$", "$\\ce{CH3CH2+}$", "$\\ce{CH3+}$"], // ORDER only: 3–5 items in the CORRECT order (first = highest)
  "options": ["...", "..."],               // COMPARE/EFFECT/MCQ: 2–4 options
  "answer": 0,                             // COMPARE/EFFECT/MCQ: index of the correct option
  "explanation": "3° > 2° > 1° > methyl: more hyperconjugating α-H and +I alkyl groups.",
  "concepts": ["hyperconjugation", "+I effect"],
  "trap": "Optional: common mistake students make."
}
```

- **compare**: two (or three) species; options are typically `["A: ...", "B: ...", "Both equal"]`.
- **effect**: "If X is introduced at position Y of Z, what happens to <property>?" Options are
  `["Increases", "Decreases", "Remains nearly the same"]` (3 options, keep this exact order).
- **mcq**: any single-correct concept question (which is most acidic, which is aromatic, the correct order is…).
- For ring compounds, use names or condensed text: `$\\ce{p-O2N-C6H4-OH}$`, "cyclopentadienyl anion", `$\\ce{C6H5-CH2+}$`.
- Only include questions with an unambiguous, textbook/JEE-accepted answer. If experimental data are needed, mention them in the explanation (e.g. pKa values).

## TOPICS (use exactly)
- Carbocation stability
- Carbanion stability
- Free radical stability
- Alkene stability
- Resonance & hyperconjugation
- Inductive effect
- Aromaticity
- Acidity
- Basicity
- Substituent effects (o/m/p)
- Tautomerism & enol content
- Physical properties (bp, dipole, bond length)
- Nucleophilicity
- Leaving group ability
- Electrophilicity & carbonyl reactivity
- SN1/SN2/E1/E2 reactivity
- Electrophilic aromatic substitution
- Rearrangements & migratory aptitude
