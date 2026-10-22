import paper from 'paper';

export interface UnitedPath {
  /** In the markup's own units. */
  bounds: { height: number; width: number; x: number; y: number };
  d: string;
}

const collectPathItems = (item: paper.Item): paper.PathItem[] => {
  if (item instanceof paper.Path || item instanceof paper.CompoundPath) return [item];

  if (item instanceof paper.Group || item instanceof paper.Layer) return item.children.flatMap(collectPathItems);

  return [];
};

/**
 * Unite every drawn element of the SVG markup into one path, as the Element panel does for icons.
 *
 * Extruding overlapping elements separately would leave intersecting solids, whose overlap the
 * slicer may read as a hole or engrave twice; the union turns them into one outline with its holes.
 * Should paper.js fail on the boolean operation, the paths are joined as they are.
 */
const unitePathData = (markup: string): null | UnitedPath => {
  const project = new paper.Project(document.createElement('canvas'));

  try {
    // applyMatrix bakes group transforms into the paths, so their data is in the markup's units
    const svgItem = project.importSVG(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, {
      applyMatrix: true,
      expandShapes: true,
    });
    const pathItems = collectPathItems(svgItem).filter((item) => !item.bounds.isEmpty());

    if (pathItems.length === 0) return null;

    const joined = {
      bounds: pathItems.map((item) => item.bounds).reduce((acc, bounds) => acc.unite(bounds)),
      d: pathItems.map((item) => item.pathData).join(' '),
    };
    let result = joined;

    try {
      const united = pathItems.reduce((acc, item) => {
        const next = acc.unite(item);

        acc.remove();
        item.remove();

        return next;
      });

      result = { bounds: united.bounds, d: united.pathData };
    } catch (error) {
      console.warn('Failed to unite SVG paths, joining them instead', error);
    }

    const { height, width, x, y } = result.bounds;

    return { bounds: { height, width, x, y }, d: result.d };
  } finally {
    project.remove();
  }
};

export default unitePathData;
