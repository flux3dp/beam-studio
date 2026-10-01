#!/usr/bin/env node
/**
 * For each design-team `flux-stamp-template@1` JSON given on the command line: writes the frame to
 * templates/catalog/<id>.svg and prints the `?raw` import plus a STAMP_TEMPLATES entry. Paste both
 * into templates/catalog.ts and tune the entry by hand.
 *
 *   node packages/core/src/web/app/components/dialogs/StampGenerator/templates/fromJson.mjs ~/Downloads/x_dev/x.json ...
 *
 * The JSON is a parameter set for the design prototype's render engine (印章製作 Stamp Maker
 * Prototype.html); the geometry below is ported from it. Prototype units: a W×H px box with
 * W = sizeMm × 4, frame inset 3px, everything else relative to R = min(rx, ry) of that frame.
 * Here it's mapped into the 150×150 design space with the frame's outer edge spanning OUTER px.
 *
 * Not ported (see PRD / memory): per-line font & bold weight, dashed rings, laurel wreaths, image
 * slots, `max` field lengths. Center lines use fit 'shrink' (prototype `Ct`: shrink-only, floor 0.5).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CATALOG_DIR = join(dirname(fileURLToPath(import.meta.url)), 'catalog');

const CENTER = 75;
/** Longest side of the outermost frame in design px (leaves a margin inside the 150 preview box). */
const OUTER = 140;
/** Em center sits about this far above the baseline for cap-height text. */
const INK_CENTER_EM = 0.35;
const ROLE = { baseline: '#1890FF', cut: '#722ED1', frame: '#E5400A' };

const r1 = (n) => Math.round(n * 10) / 10;
const r2 = (n) => Math.round(n * 100) / 100;
const firstFamily = (stack) => stack?.split(',')[0].replace(/["']/g, '').trim();
const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/** The design prototype's sample company → FLUX's own details, as the hand-authored templates use. */
const SAMPLE_COMPANY = [
  ['鴻圖創意設計有限公司', '通量三維股份有限公司'],
  ['鴻圖創意設計', '通量三維'],
  ['鴻圖設計', '通量三維'],
  ['鴻圖', '通量三維'],
  ['HONGTU DESIGN CO., LTD.', 'FLUX TECHNOLOGY INC.'],
  ['HONGTU DESIGN', 'FLUX TECHNOLOGY'],
  ['HONGTU', 'FLUX'],
];
const sample = (text) => SAMPLE_COMPANY.reduce((t, [from, to]) => t.replaceAll(from, to), String(text ?? ''));

// ---------- prototype geometry, in prototype px ----------

/** Frame box of a template: rx/ry of the outermost ring's centerline, its center and R. */
const frameOf = (json) => {
  const [wMm, hMm] = json.sizeMm;
  const W = wMm * 4;
  const H = hMm * 4;
  const rx = (W - 6) / 2;
  const ry = (H - 6) / 2;

  return { H, R: Math.min(rx, ry), W, cx: W / 2, cy: H / 2, rx, ry };
};

const isEllipse = (shape) => shape === 'round' || shape === 'oval';

/** Chord available to a horizontal text line at prototype y (prototype `UW`). */
const chordAt = (json, f, y) => {
  const a = Math.abs(y - f.cy);

  if (isEllipse(json.shape)) return a >= f.ry ? 0 : 2 * f.rx * Math.sqrt(1 - (a / f.ry) ** 2) * 0.92;

  return (f.W - 6) * 0.86;
};

// ---------- SVG emitters, in design px ----------

const ellipsePath = (cx, cy, rx, ry) =>
  `M${r2(cx - rx)} ${r2(cy)}A${r2(rx)} ${r2(ry)} 0 1 1 ${r2(cx + rx)} ${r2(cy)}A${r2(rx)} ${r2(ry)} 0 1 1 ${r2(cx - rx)} ${r2(cy)}Z`;

const roundedRectPath = (cx, cy, w, h, rc) => {
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;
  const x1 = cx + w / 2;
  const y1 = cy + h / 2;
  const c = Math.max(0, Math.min(rc, w / 2, h / 2));
  const arc = (x, y) => `A${r2(c)} ${r2(c)} 0 0 1 ${r2(x)} ${r2(y)}`;

  return (
    `M${r2(x0 + c)} ${r2(y0)}H${r2(x1 - c)}${arc(x1, y0 + c)}V${r2(y1 - c)}${arc(x1 - c, y1)}` +
    `H${r2(x0 + c)}${arc(x0, y1 - c)}V${r2(y0 + c)}${arc(x0 + c, y0)}Z`
  );
};

/**
 * A stroked frame ring (prototype `S(scale, strokeWidth)`) as a filled even-odd ring: outer
 * contour at centerline + stroke/2, inner at centerline − stroke/2.
 */
const ringPath = (json, m, scale, stroke) => {
  const f = frameOf(json);
  const half = (stroke * m.k) / 2;

  if (isEllipse(json.shape)) {
    const rx = f.rx * scale * m.k;
    const ry = f.ry * scale * m.k;

    return ellipsePath(CENTER, CENTER, rx + half, ry + half) + ellipsePath(CENTER, CENTER, rx - half, ry - half);
  }

  const w = (f.W - 6) * scale * m.k;
  const h = (f.H - 6) * scale * m.k;
  const rc = (json.p.round ? 12 * scale : 3) * m.k;

  return (
    roundedRectPath(CENTER, CENTER, w + 2 * half, h + 2 * half, rc + half) +
    roundedRectPath(CENTER, CENTER, w - 2 * half, h - 2 * half, rc - half)
  );
};

const framePath = (d) => `<path fill-rule="evenodd" d="${d}" fill="${ROLE.frame}"/>`;

/**
 * Dashed ring (prototype `S(1, stroke, '6 5')`) for round/oval frames: filled dash segments at the
 * ring's centerline plus a cut-only ellipse along their outer edge, since the cut must be one contour.
 */
const dashedRing = (json, m, stroke, on = 6, off = 5) => {
  const f = frameOf(json);
  const half = (stroke * m.k) / 2;
  const rx = f.rx * m.k;
  const ry = f.ry * m.k;
  const perimeter = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
  const period = (on + off) * m.k;
  const n = Math.max(8, Math.round(perimeter / period));
  const pt = (r, t) => `${r2(CENTER + (rx + r) * Math.cos(t))} ${r2(CENTER + (ry + r) * Math.sin(t))}`;
  const dashes = [];

  for (let i = 0; i < n; i++) {
    const t0 = (i / n) * 2 * Math.PI;
    const t1 = t0 + ((on / (on + off)) * 2 * Math.PI) / n;

    dashes.push(
      `M${pt(half, t0)}A${r2(rx + half)} ${r2(ry + half)} 0 0 1 ${pt(half, t1)}L${pt(-half, t1)}A${r2(rx - half)} ${r2(ry - half)} 0 0 0 ${pt(-half, t0)}Z`,
    );
  }

  return [
    `<path d="${ellipsePath(CENTER, CENTER, rx + half, ry + half)}" stroke="${ROLE.cut}" fill="none"/>`,
    framePath(dashes.join('')),
  ];
};
const rectPath = (cx, cy, w, h) =>
  framePath(`M${r2(cx - w / 2)} ${r2(cy - h / 2)}h${r2(w)}v${r2(h)}h${r2(-w)}Z`);

/** Arc-text baseline (prototype `di`): top arc runs over the top, bottom arc under the bottom. */
const arcBaseline = (json, m, radiusScale, bottom) => {
  const f = frameOf(json);
  const rx = f.rx * radiusScale * m.k;
  const ry = f.ry * radiusScale * m.k;
  const sweep = bottom ? '0 0 0' : '0 1 1';

  return `<path d="M${r2(CENTER - rx)} ${CENTER}A${r2(rx)} ${r2(ry)} ${sweep} ${r2(CENTER + rx)} ${CENTER}" stroke="${ROLE.baseline}"/>`;
};

// ---------- slot emitters (return TS source lines) ----------

const fieldOf = (json, key) => json.fields.find((f) => f.key === key);
const labelProp = (json, key) => (fieldOf(json, key) ? `label: ${q(fieldOf(json, key).label)}, ` : '');

const arcSlot = (json, m, { id, key, fontSize, baseline, letterSpacing, text }) => {
  const size = Math.round(fontSize * m.k);

  return `      { baseline: ${baseline}, fontSize: ${size}, id: '${id}', ${labelProp(json, key)}letterSpacing: ${r1(letterSpacing * m.k)}, offset: ${r1(INK_CENTER_EM * size)}, placeholder: ${q(sample(text))} },`;
};

/** A horizontal line of text with its baseline at prototype (cx, y) (prototype `Ct`). */
const lineSlot = (json, m, { id, key, fontSize, x, y, text, letterSpacing = 0, clearOf, centerY, knockout, pinFont }) => {
  const f = frameOf(json);
  const size = Math.round(fontSize * m.k);
  const width = r1(chordAt(json, f, y) * m.k);
  // `centerY`: the ink is vertically centered on y (prototype `vc`) instead of y being the baseline.
  const cy = centerY ? m.y(y) : m.y(y) - INK_CENTER_EM * size;
  const ls = letterSpacing ? `letterSpacing: ${r1(letterSpacing * m.k)}, ` : '';
  const clear = clearOf ? `clearOf: { elementId: '${clearOf}', padding: ${ORNAMENT_PADDING} }, ` : '';
  const ko = knockout ? 'knockout: true, ' : '';
  const pin = pinFont ? `fontPostscriptName: '${pinFont}', ` : '';

  return `      { bounds: { height: ${size}, width: ${width}, x: ${r1(m.x(x) - width / 2)}, y: ${r1(cy - size / 2)} }, fit: 'shrink', fontSize: ${size}, id: '${id}', ${labelProp(json, key)}${ls}${clear}${ko}${pin}placeholder: ${q(sample(text))} },`;
};

/** A bundled shape (templates/icons) in a square box of `size` design px centered at (cx, cy). */
const shapeSlot = (id, shapeKey, cx, cy, size) =>
  `      { bounds: { height: ${r1(size)}, width: ${r1(size)}, x: ${r1(cx - size / 2)}, y: ${r1(cy - size / 2)} }, id: '${id}', shapeKey: '${shapeKey}' },`;

const starSlot = (id, cx, cy, r) => shapeSlot(id, 'stamp/star', cx, cy, 2 * r);

/** Vertical glyph column (prototype `UI`): 1.05 em pitch, centered on prototype (cx, cy). */
const columnSlot = (json, m, { id, key, fontSize, x, y, text }) => {
  const size = Math.round(fontSize * m.k);
  const n = Math.max(1, String(text).replace(/\s+/g, '').length);
  const height = r1(size * (1 + (n - 1) * 1.05));

  return `      { bounds: { height: ${height}, width: ${size}, x: ${r1(m.x(x) - size / 2)}, y: ${r1(m.y(y) - height / 2)} }, fit: 'center', fontSize: ${size}, id: '${id}', ${labelProp(json, key)}placeholder: ${q(sample(text))}, vertical: true },`;
};

/**
 * Prototype ornament (`Qm`): a 24×24 icon viewport at scale s, centered at prototype (cx, cy).
 * buildElement fits the icon's INK to the slot box, so the box is the ink's extent × s, not 24 × s.
 */
const ornSlot = (json, m, cx, cy, s) => {
  if (!ORNAMENTS[json.p.orn]) {
    console.warn(`  ${json.id}: ornament "${json.p.orn}" has no icon in templates/icons yet, skipped`);

    return [];
  }

  // Ornaments are user-resizable (Element tab); stars stay fixed.
  return [
    shapeSlot('orn', `stamp/${json.p.orn}`, m.x(cx), m.y(cy), ORNAMENTS[json.p.orn] * s * m.k).replace(", shapeKey:", ", label: '圖示', shapeKey:"),
  ];
};

/** Design px between an ornament and the text rows that keep clear of it. */
const ORNAMENT_PADDING = 4;

/** Icon → larger side of its ink inside the 24×24 viewport (templates/icons/*.svg). */
const ORNAMENTS = { camera: 18, check: 18.4, paw: 17.4, plane: 19 };

// ---------- generators ----------

const GENERATORS = {
  ringAround(json, m) {
    const { p } = json;
    const f = frameOf(json);
    const svg = [];
    const texts = [];
    const elements = [];
    let baseline = 0;

    svg.push(framePath(ringPath(json, m, 1, p.ow || 3.5)));

    if (p.inner !== false) svg.push(framePath(ringPath(json, m, p.ir || 0.7, p.iw || 1.6)));

    if (p.top !== null) {
      svg.push(arcBaseline(json, m, p.tr || 0.8, false));
      texts.push(
        arcSlot(json, m, {
          baseline: baseline++,
          fontSize: f.R * (p.ts || 0.16),
          id: 'arc_top',
          key: 'top',
          letterSpacing: p.tls ?? 2,
          text: p.topD,
        }),
      );
    }

    for (const [i, c] of (p.center || []).entries()) {
      texts.push(lineSlot(json, m, { fontSize: f.R * c.s, id: c.k, key: c.k, text: c.d, x: f.cx, y: f.cy + f.R * c.y }));

      if (i === 0 && c.font) console.warn(`  ${json.id}: per-line font "${firstFamily(c.font)}" ignored`);
    }

    if (p.bottom) {
      svg.push(arcBaseline(json, m, p.br || 0.88, true));
      texts.push(
        arcSlot(json, m, {
          baseline: baseline++,
          fontSize: f.R * (p.bs || 0.12),
          id: 'arc_bottom',
          key: 'bottom',
          letterSpacing: p.bls ?? 2,
          text: p.bottomD,
        }),
      );
    }

    if (p.stars) {
      const r = f.R * 0.07 * m.k;

      elements.push(starSlot('star_left', m.x(f.cx - f.rx * 0.8), CENTER, r));
      elements.push(starSlot('star_right', m.x(f.cx + f.rx * 0.8), CENTER, r));
    }

    if (p.starC) elements.push(starSlot('star_center', CENTER, m.y(f.cy + f.R * (p.starY || 0)), f.R * p.starC * m.k));

    if (p.hr) {
      for (const sign of [-1, 1]) svg.push(rectPath(CENTER, m.y(f.cy + sign * f.R * p.hr), f.R * m.k, 1.4 * m.k));
    }

    if (p.orn) elements.push(...ornSlot(json, m, f.cx, f.cy + f.R * (p.ornY || 0), f.R * (p.ornS || 0.035)));

    warnUnsupported(json, ['laurel', 'slot', 'dash1', 'dash2']);

    return { elements, svg, texts };
  },

  /** Horizontal text rows in a rect/oval frame; sizes relative to min(W, H), y offsets relative to H. */
  rows(json, m) {
    const { p } = json;
    const f = frameOf(json);
    const minWH = Math.min(f.W, f.H);
    const svg = [framePath(ringPath(json, m, 1, p.ow || 3))];
    const elements = [];

    if (p.double) svg.push(framePath(ringPath(json, m, p.ir || 0.86, 1.3)));

    // Rows sit beside the ornament when there is one; the box trims to the icon's built size.
    const texts = (p.rows || []).map((row) =>
      lineSlot(json, m, {
        clearOf: p.orn && ORNAMENTS[p.orn] ? 'orn' : undefined,
        fontSize: minWH * row.s * 0.5,
        id: row.k,
        key: row.k,
        letterSpacing: row.ls || 0,
        text: row.d,
        x: f.cx,
        y: f.cy + f.H * row.y,
      }),
    );

    if (p.divider) svg.push(rectPath(CENTER, m.y(f.cy + f.H * p.divider), f.W * 0.72 * m.k, 1.4 * m.k));

    if (p.sigline) svg.push(rectPath(m.x(f.W * 0.66), m.y(f.H * 0.72), f.W * 0.48 * m.k, 1.6 * m.k));

    if (p.orn) {
      elements.push(...ornSlot(json, m, f.W * (p.ornX || 0.2), f.cy + f.H * (p.ornY || 0), minWH * (p.ornS || 0.016)));
    }

    warnUnsupported(json, ['slot']);

    return { elements, svg, texts };
  },

  /** Ornament above a caption, optional arcs; everything relative to R. */
  badge(json, m) {
    const { p } = json;
    const f = frameOf(json);
    const svg = [framePath(ringPath(json, m, 1, p.ow || 3))];
    const texts = [];
    const elements = [];
    let baseline = 0;

    if (p.double) svg.push(framePath(ringPath(json, m, 0.58, 1.4)));

    if (p.orn) elements.push(...ornSlot(json, m, f.cx, f.cy + f.R * (p.ornY ?? -0.12), f.R * (p.ornS || 0.04)));

    if (p.top) {
      svg.push(arcBaseline(json, m, 0.82, false));
      texts.push(
        arcSlot(json, m, { baseline: baseline++, fontSize: f.R * (p.ts || 0.15), id: 'arc_top', key: 'top', letterSpacing: 2, text: p.topD }),
      );
    }

    if (p.text) {
      texts.push(lineSlot(json, m, { fontSize: f.R * (p.textS || 0.2), id: 'text', key: 'text', text: p.textD, x: f.cx, y: f.cy + f.R * (p.textY ?? 0.62) }));
    }

    if (p.bottom) {
      svg.push(arcBaseline(json, m, 0.84, true));
      texts.push(
        arcSlot(json, m, { baseline: baseline++, fontSize: f.R * (p.bs || 0.13), id: 'arc_bottom', key: 'bottom', letterSpacing: 2, text: p.bottomD }),
      );
    }

    warnUnsupported(json, ['dashline']);

    return { elements, svg, texts };
  },
};

GENERATORS.seal = (json, m) => {
  const { p } = json;
  const f = frameOf(json);
  const svg = [framePath(ringPath(json, m, 1, p.ow || 4))];
  const sizeK = p.sizeK || 1;
  const chars = String(p.textD).length;
  const texts = [];

  if (p.grid) console.warn(`  ${json.id}: seal "grid" layout not supported yet, rendered as one line`);

  if (p.vert) {
    const size = Math.min(f.R * 0.62, (2 * f.ry * 0.78) / chars) * sizeK;

    texts.push(columnSlot(json, m, { fontSize: size, id: 'text', key: 'text', text: p.textD, x: f.cx, y: f.cy }));
  } else {
    texts.push(
      lineSlot(json, m, { centerY: true, fontSize: f.R * (chars === 1 ? 1.15 : 0.66) * sizeK, id: 'text', key: 'text', text: p.textD, x: f.cx, y: f.cy }),
    );
  }

  warnUnsupported(json, ['cross']);

  return { elements: [], svg, texts };
};

/** Date stamps: optional ring texts, a date line, and (ellipses) two rules around it. */
GENERATORS.date = (json, m) => {
  const { p } = json;
  const f = frameOf(json);
  const ellipse = isEllipse(json.shape);
  // The prototype pairs `dash` with a near-invisible solid ring (ow 0.01): only the dashes are drawn.
  const svg = p.dash && isEllipse(json.shape) ? dashedRing(json, m, 3) : [framePath(ringPath(json, m, 1, p.ow || 3))];

  if (p.dash && !isEllipse(json.shape)) console.warn(`  ${json.id}: dashed rect frame not supported yet, drawn solid`);
  const texts = [];
  let baseline = 0;

  if (p.top) {
    if (ellipse) {
      svg.push(arcBaseline(json, m, 0.8, false));
      texts.push(arcSlot(json, m, { baseline: baseline++, fontSize: f.R * 0.17 * (p.topK || 1), id: 'arc_top', key: 'top', letterSpacing: 2, text: p.topD }));
    } else {
      texts.push(lineSlot(json, m, { fontSize: f.H * 0.24 * (p.topK || 1), id: 'top', key: 'top', text: p.topD, x: f.cx, y: f.H * 0.36 }));
    }
  }

  texts.push(
    lineSlot(json, m, {
      fontSize: (ellipse ? f.R * 0.3 : f.H * 0.32) * (p.dateK || 1),
      id: 'date',
      key: 'date',
      // The prototype sets a serif face for dates; pin the bundled Montserrat so digits and dots always resolve.
      pinFont: 'Montserrat-Medium',
      text: '2026.09.18',
      x: f.cx,
      y: f.cy + (ellipse ? f.R * 0.1 : f.H * 0.12),
    }),
  );

  if (ellipse) {
    svg.push(rectPath(CENTER, m.y(f.cy - f.R * 0.22), f.R * 1.1 * m.k, 1.6 * m.k));
    svg.push(rectPath(CENTER, m.y(f.cy + f.R * 0.2), f.R * 1.1 * m.k, 1.6 * m.k));
  }

  if (p.bottom && ellipse) {
    svg.push(arcBaseline(json, m, 0.82, true));
    texts.push(arcSlot(json, m, { baseline: baseline++, fontSize: f.R * 0.14 * (p.bottomK || 1), id: 'arc_bottom', key: 'bottom', letterSpacing: 2, text: p.bottomD }));
  }

  return { elements: [], svg, texts };
};

/** Split layouts; only `bar` (filled top band with knocked-out text) is ported so far. */
GENERATORS.split = (json, m) => {
  const { p } = json;
  const f = frameOf(json);
  const pct = (k) => (p._pct && p._pct[k]) || 1;

  if (p.mode !== 'bar') {
    console.warn(`  ${json.id}: split mode "${p.mode}" not supported yet, skipped`);

    return null;
  }

  const svg = [framePath(ringPath(json, m, 1, 2.6))];
  const barH = f.H * 0.3;

  svg.push(rectPath(CENTER, m.y(3 + barH / 2), (f.W - 6) * m.k, barH * m.k));

  const texts = [
    lineSlot(json, m, { fontSize: f.H * 0.16 * pct('top'), id: 'top', key: 'top', knockout: true, text: p.topD, x: f.cx, y: f.H * 0.24 }),
    lineSlot(json, m, { fontSize: f.H * 0.14 * pct('text'), id: 'text', key: 'text', text: p.textD, x: f.cx, y: f.H * 0.58 }),
    lineSlot(json, m, { fontSize: f.H * 0.09 * pct('sub'), id: 'sub', key: 'sub', text: p.subD, x: f.cx, y: f.H * 0.84 }),
  ];

  return { elements: [], svg, texts };
};

/** Japanese seal modes: maru1 (one glyph), maruV (column), sumi (glyph + inner ring), ginko (rules + sub). */
GENERATORS.jp = (json, m) => {
  const { p } = json;
  const f = frameOf(json);
  const svg = [framePath(ringPath(json, m, 1, p.ow || 3.4))];
  const sizeK = p.sizeK || 1;
  const chars = String(p.textD).replace(/\s+/g, '').length;
  const texts = [];
  const glyph = (scale) =>
    lineSlot(json, m, { centerY: true, fontSize: f.R * scale * sizeK, id: 'text', key: 'text', text: p.textD, x: f.cx, y: f.cy });

  if (p.mode === 'maru1') texts.push(glyph(1.2));
  else if (p.mode === 'sumi') {
    texts.push(glyph(1.1));
    svg.push(framePath(ringPath(json, m, 0.82, 1.2)));
  } else if (p.mode === 'maruV') {
    texts.push(columnSlot(json, m, { fontSize: Math.min(f.R * 0.8, (2 * f.ry * 0.72) / chars) * sizeK, id: 'text', key: 'text', text: p.textD, x: f.cx, y: f.cy }));
  } else if (p.mode === 'ginko') {
    for (const sign of [-1, 1]) svg.push(rectPath(CENTER, m.y(f.cy + sign * f.ry * 0.42), f.rx * 1.44 * m.k, 2 * m.k));
    texts.push(lineSlot(json, m, { fontSize: f.R * 0.46 * sizeK, id: 'text', key: 'text', text: p.textD, x: f.cx, y: f.cy + f.R * 0.18 }));
    texts.push(lineSlot(json, m, { fontSize: f.R * 0.24, id: 'sub', key: 'sub', text: p.subD || '銀行之印', x: f.cx, y: f.cy + f.ry * 0.78 }));
  } else {
    console.warn(`  ${json.id}: jp mode "${p.mode}" not supported yet, skipped`);

    return null;
  }

  return { elements: [], svg, texts };
};

const warnUnsupported = (json, keys) => {
  for (const key of keys) if (json.p[key]) console.warn(`  ${json.id}: "${key}" not supported yet, skipped`);
};

// ---------- entry ----------

/**
 * `preferredFonts` from the JSON's preset: Latin presets try the named family then the bundled
 * Montserrat; tc-kai / jp presets use the shared lists from templates/fonts.ts; anything else falls
 * through to the user's default font.
 */
const fontCandidates = (json) => {
  const preset = json.fontPreset || '';
  const family = firstFamily(json.fontStack);

  if (preset.startsWith('en') || preset === 'mono-type') return `    preferredFonts: [${[family, 'Montserrat-Medium'].filter(Boolean).map(q).join(', ')}],\n`;

  if (preset === 'tc-kai') return '    preferredFonts: KAI_FONTS,\n';

  if (preset.startsWith('jp')) return '    preferredFonts: JP_FONTS,\n';

  return '';
};

const convert = (json) => {
  const gen = GENERATORS[json.gen];

  if (json.schema !== 'flux-stamp-template@1' || !gen) {
    console.warn(`  ${json.id}: unsupported (${json.schema}, gen ${json.gen}), skipped`);

    return null;
  }

  const f = frameOf(json);
  const ow = json.p.ow || 3.5;
  const k = OUTER / Math.max(2 * f.rx + ow, 2 * f.ry + ow);
  const m = { k, x: (px) => CENTER + (px - f.cx) * k, y: (py) => CENTER + (py - f.cy) * k };
  const result = gen(json, m);

  if (!result) return null;

  const { elements, svg, texts } = result;
  const [w, h] = json.sizeMm;
  const fontsProp = fontCandidates(json);
  const svgConst = json.id.toUpperCase();

  mkdirSync(CATALOG_DIR, { recursive: true });
  writeFileSync(
    join(CATALOG_DIR, `${json.id}.svg`),
    `<svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
<!-- Generated by fromJson.mjs from ${json.id}.json (${json.gen}, ${json.shape}, ${w}×${h} mm). -->
${svg.join('\n')}
</svg>
`,
  );

  return `  {
    category: ${q(json.shape === 'round' ? 'circle' : json.shape)},
    elements: [
${elements.join('\n')}
    ],
    id: ${q(json.id)},
    name: ${q(json.name)},
    sharedFont: true,
    sizes: [{ label: ${q(w === h ? `${w}mm` : `${w} × ${h} mm`)}, widthMm: ${w} }],
    svgContent: ${svgConst},
    texts: [
${texts.join('\n')}
    ],
  },`;
};

const imports = [];
const entries = [];

for (const file of process.argv.slice(2)) {
  const json = JSON.parse(readFileSync(file, 'utf8'));
  const entry = convert(json);

  if (!entry) continue;

  imports.push(`import ${json.id.toUpperCase()} from './catalog/${json.id}.svg?raw';`);
  entries.push(entry);
}

console.log(imports.join('\n'));
console.log();
console.log(entries.join('\n'));
