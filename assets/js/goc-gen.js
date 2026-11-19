/* GOC question generator — produces unlimited "effect", "compare" and "order" questions from
   experimental aqueous pKa data (25 °C, standard literature values) and a curated qualitative table.
   Only differences large enough to be textbook-unambiguous are used. */
(function () {
  'use strict';
  const RL = window.RL;

  const SUB = {
    NO2: { name: 'nitro', f: 'O2N', label: '$\\ce{-NO2}$', desc: 'a strong electron-withdrawing group (−I and −M)', M: -1, I: -1 },
    CN: { name: 'cyano', f: 'NC', label: '$\\ce{-CN}$', desc: 'an electron-withdrawing group (−I and −M)', M: -1, I: -1 },
    Cl: { name: 'chloro', f: 'Cl', label: '$\\ce{-Cl}$', desc: 'electron-withdrawing overall (−I outweighs its weak +M)', M: 1, I: -1 },
    F: { name: 'fluoro', f: 'F', label: '$\\ce{-F}$', desc: 'strongly −I with a +M effect (2p–2p overlap)', M: 1, I: -1 },
    CH3: { name: 'methyl', f: 'H3C', label: '$\\ce{-CH3}$', desc: 'electron-donating (+I and hyperconjugation)', M: 0, I: 1 },
    OCH3: { name: 'methoxy', f: 'CH3O', label: '$\\ce{-OCH3}$', desc: 'electron-donating by resonance (+M) but −I by induction', M: 1, I: -1 },
    OH: { name: 'hydroxy', f: 'HO', label: '$\\ce{-OH}$', desc: 'electron-donating by resonance (+M) but −I by induction', M: 1, I: -1 },
    NH2: { name: 'amino', f: 'H2N', label: '$\\ce{-NH2}$', desc: 'a strong +M electron-donating group', M: 1, I: -1 }
  };
  const POS = { o: 'ortho', m: 'meta', p: 'para' };

  // pKa values. For anilines: pKa of the conjugate acid (anilinium) — higher pKa = stronger base.
  const SYSTEMS = {
    phenol: {
      title: 'phenol', parentF: 'C6H5-OH', grp: 'OH', prop: 'acidic strength', more: 'more acidic', kind: 'acid', topic: 'Acidity',
      species: 'phenoxide ion', parent: 9.99,
      named: (s, p) => `${p}-${s === 'CH3' ? 'cresol' : SUB[s].name + 'phenol'}`,
      data: { NO2: { o: 7.23, m: 8.36, p: 7.15 }, CN: { m: 8.61, p: 7.97 }, Cl: { o: 8.56, m: 9.12, p: 9.41 }, F: { m: 9.28 },
        CH3: { o: 10.29, m: 10.09, p: 10.26 }, OCH3: { m: 9.65, p: 10.21 }, NH2: { p: 10.30 } }
    },
    benzoic: {
      title: 'benzoic acid', parentF: 'C6H5-COOH', grp: 'COOH', prop: 'acidic strength', more: 'more acidic', kind: 'acid', topic: 'Acidity',
      species: 'benzoate ion', parent: 4.20,
      named: (s, p) => `${p}-${s === 'CH3' ? 'toluic acid' : SUB[s].name + 'benzoic acid'}`,
      data: { NO2: { o: 2.17, m: 3.45, p: 3.44 }, CN: { m: 3.60, p: 3.55 }, Cl: { o: 2.94, m: 3.83, p: 3.99 }, F: { o: 3.27, m: 3.86, p: 4.14 },
        CH3: { o: 3.91, m: 4.27, p: 4.37 }, OCH3: { o: 4.09, m: 4.09, p: 4.47 }, OH: { o: 2.97, m: 4.08, p: 4.58 }, NH2: { p: 4.92 } }
    },
    aniline: {
      title: 'aniline', parentF: 'C6H5-NH2', grp: 'NH2', prop: 'basic strength', more: 'more basic', kind: 'base', topic: 'Basicity',
      species: 'lone pair on nitrogen', parent: 4.60,
      named: (s, p) => `${p}-${s === 'CH3' ? 'toluidine' : s === 'OCH3' ? 'anisidine' : SUB[s].name + 'aniline'}`,
      data: { NO2: { o: -0.26, m: 2.47, p: 1.00 }, CN: { m: 2.75, p: 1.74 }, Cl: { o: 2.65, m: 3.46, p: 3.98 },
        CH3: { o: 4.44, m: 4.73, p: 5.08 }, OCH3: { m: 4.23, p: 5.34 }, NH2: { m: 4.88, p: 6.08 } }
    }
  };
  // strength: acids — lower pKa stronger; bases (anilinium pKa) — higher stronger
  const strength = (sys, pKa) => (SYSTEMS[sys].kind === 'acid' ? -pKa : pKa);

  function reason(sys, s, p, up) {
    const S = SYSTEMS[sys], X = SUB[s], pos = POS[p];
    let why;
    if (p === 'o' && sys === 'benzoic') why = '<b>Ortho effect</b>: an ortho group twists –COOH out of the ring plane (steric inhibition of resonance), so almost every ortho-substituted benzoic acid is stronger than benzoic acid' + (s === 'OH' ? ', and o-OH also H-bonds to the carboxylate' : '') + '.';
    else if (p === 'o' && sys === 'aniline') why = '<b>Ortho effect</b>: steric hindrance to protonation and to solvation of the anilinium ion makes ortho-substituted anilines weaker bases' + (X.I < 0 ? ', reinforced by the −I effect' : '') + '.';
    else if (p === 'm' && X.M !== 0) why = `At the <b>meta</b> position the resonance effect of ${X.label} cannot reach the reacting centre — only its <b>${X.I < 0 ? '−I' : '+I'}</b> effect operates.`;
    else if (p === 'm') why = `At the meta position ${X.label} acts through its inductive/hyperconjugative effect only.`;
    else why = `At the <b>${pos}</b> position ${X.label} is ${X.desc}; ${X.M !== 0 ? 'its resonance effect reaches the reacting centre directly.' : 'it acts through induction and hyperconjugation.'}`;
    const eff = S.kind === 'acid'
      ? (up ? `This stabilises the ${S.species} (disperses the negative charge)` : `This destabilises the ${S.species} (intensifies the negative charge)`)
      : (up ? 'This increases electron density on nitrogen (lone pair more available)' : 'This decreases the availability of the nitrogen lone pair');
    return `${why} ${eff}, so ${S.prop} ${up ? 'increases' : 'decreases'}.`;
  }
  const pk = (sys) => (SYSTEMS[sys].kind === 'acid' ? 'pKa' : 'pKa of conjugate acid');
  const nameOf = (sys, s, p) => SYSTEMS[sys].named(s, p);
  const formulaOf = (sys, s) => `$\\ce{${SUB[s].f}-C6H4-${SYSTEMS[sys].grp}}$`;

  function entries(sys) { const out = []; for (const [s, d] of Object.entries(SYSTEMS[sys].data)) for (const [p, v] of Object.entries(d)) out.push({ sys, s, p, v }); return out; }

  function effectQ(sys) {
    const S = SYSTEMS[sys];
    const cand = entries(sys).filter((e) => Math.abs(e.v - S.parent) >= 0.07);
    const e = RL.pick(cand); const up = strength(sys, e.v) > strength(sys, S.parent);
    return {
      id: `gen-eff-${sys}-${e.s}-${e.p}`, generated: true, topic: 'Substituent effects (o/m/p)', type: 'effect', difficulty: e.p === 'm' || e.p === 'o' ? 'hard' : 'medium',
      question: `If a ${SUB[e.s].label} group is introduced at the <b>${POS[e.p]}</b> position of ${S.title} ($\\ce{${S.parentF}}$), what happens to its <b>${S.prop}</b>?`,
      options: ['Increases', 'Decreases', 'Remains nearly the same'], answer: up ? 0 : 1,
      explanation: `${reason(sys, e.s, e.p, up)} (${pk(sys)}: ${S.title} ${S.parent} → ${nameOf(sys, e.s, e.p)} ${e.v})`,
      concepts: [SUB[e.s].M ? (SUB[e.s].M > 0 ? '+M effect' : '−M effect') : 'hyperconjugation', SUB[e.s].I > 0 ? '+I effect' : '−I effect', ...(e.p === 'o' && sys !== 'phenol' ? ['ortho effect'] : [])],
      trap: (e.s === 'OCH3' || e.s === 'OH') && e.p === 'm' ? 'meta-OCH₃/OH act as electron-WITHDRAWING (−I only) — opposite of their para behaviour.' : ''
    };
  }
  function compareQ(sys) {
    const S = SYSTEMS[sys]; const all = [{ sys, s: null, p: null, v: S.parent }, ...entries(sys)];
    for (let t = 0; t < 40; t++) {
      const [a, b] = RL.shuffle(all).slice(0, 2);
      if (Math.abs(a.v - b.v) < 0.3) continue;
      const nm = (e) => (e.s ? `${nameOf(sys, e.s, e.p)} ${formulaOf(sys, e.s)}` : `${S.title} $\\ce{${S.parentF}}$`);
      const ans = strength(sys, a.v) > strength(sys, b.v) ? 0 : 1;
      const win = ans ? b : a, lose = ans ? a : b;
      const note = (e) => (e.s ? reason(sys, e.s, e.p, strength(sys, e.v) > strength(sys, S.parent)) : '');
      return {
        id: `gen-cmp-${sys}-${a.s}${a.p}-${b.s}${b.p}`, generated: true, topic: S.topic, type: 'compare', difficulty: 'medium',
        question: `Which is the <b>stronger ${S.kind}</b>?`,
        options: [`A: ${nm(a)}`, `B: ${nm(b)}`], answer: ans,
        explanation: `${win.s ? nameOf(sys, win.s, win.p) : S.title} (${pk(sys)} ${win.v}) is ${S.more} than ${lose.s ? nameOf(sys, lose.s, lose.p) : S.title} (${pk(sys)} ${lose.v}). ${note(win)}`,
        concepts: ['substituent effects', S.kind === 'acid' ? 'conjugate base stability' : 'lone-pair availability']
      };
    }
    return effectQ(sys);
  }
  function orderQ(sys) {
    const S = SYSTEMS[sys]; const all = [{ sys, s: null, p: null, v: S.parent }, ...entries(sys)];
    const n = RL.pick([3, 4]);
    for (let t = 0; t < 80; t++) {
      const pickd = RL.shuffle(all).slice(0, n).sort((x, y) => strength(sys, y.v) - strength(sys, x.v));
      if (pickd.some((e, i) => i && Math.abs(e.v - pickd[i - 1].v) < 0.3)) continue;
      const lbl = (e) => (e.s ? nameOf(sys, e.s, e.p) : S.title);
      return {
        id: `gen-ord-${sys}-${pickd.map((e) => e.s + e.p).join('-')}`, generated: true, topic: S.topic, type: 'order', difficulty: n === 4 ? 'hard' : 'medium',
        question: `Arrange the following ${S.kind === 'acid' ? 'acids' : 'bases'}`, criterion: `decreasing order of ${S.prop}`,
        items: pickd.map(lbl),
        explanation: `${pk(sys)} values: ${pickd.map((e) => `${lbl(e)} ${e.v}`).join(' · ')}. ${S.kind === 'acid' ? 'Lower pKa = stronger acid.' : 'Higher pKa of the conjugate acid = stronger base.'} Electron-withdrawing groups at o/p (−M) have the largest effect; at meta only induction acts${sys !== 'phenol' ? '; ortho substituents show the ortho effect' : ''}.`,
        concepts: ['substituent effects', 'pKa']
      };
    }
    return effectQ(sys);
  }

  // Qualitative (textbook) effects on benzylic intermediates: +1 stabilises, -1 destabilises. Ambiguous cells omitted.
  const BENZYL = {
    cation: { title: 'benzyl carbocation', f: 'C6H5-CH2+', topic: 'Carbocation stability',
      t: { NO2: { o: -1, m: -1, p: -1 }, CN: { o: -1, m: -1, p: -1 }, CH3: { o: 1, m: 1, p: 1 }, OCH3: { o: 1, m: -1, p: 1 }, OH: { o: 1, m: -1, p: 1 }, NH2: { o: 1, m: -1, p: 1 }, Cl: { m: -1 } } },
    anion: { title: 'benzyl carbanion', f: 'C6H5-CH2-', topic: 'Carbanion stability',
      t: { NO2: { o: 1, m: 1, p: 1 }, CN: { o: 1, m: 1, p: 1 }, CH3: { o: -1, m: -1, p: -1 }, OCH3: { m: 1, p: -1 }, NH2: { p: -1 }, Cl: { m: 1, p: 1 } } }
  };
  function benzylQ(kind) {
    const B = BENZYL[kind]; const opts = [];
    for (const [s, d] of Object.entries(B.t)) for (const [p, v] of Object.entries(d)) opts.push({ s, p, v });
    const e = RL.pick(opts); const X = SUB[e.s]; const up = e.v > 0;
    const charge = kind === 'cation' ? 'positive' : 'negative';
    let why;
    if (e.p === 'm' && X.M !== 0) why = `At the meta position the resonance effect of ${X.label} cannot delocalise the ${charge} charge; only its ${X.I < 0 ? '−I' : '+I'} effect acts.`;
    else why = `At the ${POS[e.p]} position ${X.label} is ${X.desc}${X.M !== 0 ? ' and can interact with the benzylic centre through resonance' : ''}.`;
    return {
      id: `gen-bz-${kind}-${e.s}-${e.p}`, generated: true, topic: B.topic, type: 'effect', difficulty: e.p === 'm' ? 'hard' : 'medium',
      question: `If ${X.label} is introduced at the <b>${POS[e.p]}</b> position of the ${B.title} ($\\ce{${B.f}}$), what happens to its <b>stability</b>?`,
      options: ['Increases', 'Decreases', 'Remains nearly the same'], answer: up ? 0 : 1,
      explanation: `${why} Electron ${kind === 'cation' ? 'donation stabilises a carbocation' : 'withdrawal stabilises a carbanion'}, so stability ${up ? 'increases' : 'decreases'}.`,
      concepts: [kind === 'cation' ? 'carbocation stability' : 'carbanion stability', X.M ? (X.M > 0 ? '+M effect' : '−M effect') : 'hyperconjugation'],
      trap: e.p === 'm' && (e.s === 'OCH3' || e.s === 'OH' || e.s === 'NH2') ? 'At meta these "donors" act only by −I, so they withdraw electrons.' : ''
    };
  }

  /** Generate one random question, optionally restricted to a topic. Returns null if the topic has no generator. */
  RL.generateGOC = (topic) => {
    const makers = [
      ['Substituent effects (o/m/p)', () => effectQ(RL.pick(['phenol', 'benzoic', 'aniline']))],
      ['Acidity', () => (Math.random() < 0.5 ? compareQ : orderQ)(RL.pick(['phenol', 'benzoic']))],
      ['Basicity', () => (Math.random() < 0.5 ? compareQ : orderQ)('aniline')],
      ['Carbocation stability', () => benzylQ('cation')],
      ['Carbanion stability', () => benzylQ('anion')]
    ];
    const pool = topic && topic !== 'all' ? makers.filter(([t]) => t === topic) : makers;
    if (!pool.length) return null;
    return RL.pick(pool)[1]();
  };
  RL.GOC_GEN_TOPICS = ['Substituent effects (o/m/p)', 'Acidity', 'Basicity', 'Carbocation stability', 'Carbanion stability'];
})();
