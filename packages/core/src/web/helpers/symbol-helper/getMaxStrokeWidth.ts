import getRealSymbol from './getRealSymbol';

const maxStrokeAttr = (root: Element): number => {
  let max = 0;

  root.querySelectorAll('[stroke-width]').forEach((elem) => {
    if (elem.getAttribute('stroke') === 'none') return;

    const strokeWidth = Number.parseFloat(elem.getAttribute('stroke-width') || '0');

    if (!Number.isNaN(strokeWidth)) max = Math.max(max, strokeWidth);
  });

  return max;
};

/**
 * Widest rendered stroke under `root`, in its user units: stroke-width attributes of its own
 * elements plus those of symbols referenced by `use` elements, scaled by the use transform.
 * getBBox ignores strokes, so rasters pad their box by half of this to keep edge strokes.
 * ponytail: attributes only; class-based widths and transforms inside the subtree are ignored
 */
const getMaxStrokeWidth = (root: Element): number => {
  let max = maxStrokeAttr(root);

  root.querySelectorAll('use').forEach((use) => {
    const symbol = getRealSymbol(use);

    if (!symbol) return;

    const m = use.transform.baseVal.consolidate()?.matrix;
    const scale = m ? Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) : 1;

    max = Math.max(max, maxStrokeAttr(symbol) * scale);
  });

  return max;
};

export default getMaxStrokeWidth;
