import type paper from 'paper';

/**
 * Unites an item with itself to merge overlapping contours. Fonts built from variable sources
 * (Montserrat's "4" is a body plus a separate bar) overlap on purpose; nonzero fill hides that, but
 * containment-based steps (invert) and even-odd renderers would punch the overlap out. ~10–100ms/line.
 */
export const resolveOverlaps = (item: paper.PathItem): paper.PathItem => {
  const clean = item.unite(item, { insert: true });

  item.remove();

  return clean;
};
