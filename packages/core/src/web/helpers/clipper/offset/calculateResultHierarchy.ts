import getClipperLib from '../getClipperLib';

import type { Path } from './constants';

const pathContainsPath = (outer: Path, inner: Path): boolean => {
  const ClipperLib = getClipperLib();

  for (const point of inner) {
    if (ClipperLib.Clipper.PointInPolygon(point, outer) < 1) return false;
  }

  return true;
};

export const calculateResultHierarchy = (paths: Path[]) => {
  const ClipperLib = getClipperLib();
  const data = paths
    .map((path) => ({ area: ClipperLib.Clipper.Area(path) as number, level: 0, parent: -1, path }))
    .sort((a, b) => Math.abs(b.area) - Math.abs(a.area));

  for (let i = 1; i < data.length; i++) {
    const { area: currentArea, path: currentPath } = data[i];

    for (let j = i - 1; j >= 0; j--) {
      const { area: area2, path: path2 } = data[j];

      if (
        Math.abs(area2) > Math.abs(currentArea) && // Only consider larger areas
        Math.sign(area2) !== Math.sign(currentArea) && // Only consider opposite signs (hole vs outer)
        pathContainsPath(path2, currentPath)
      ) {
        data[i].parent = j;
        data[i].level = data[j].level + 1;
        break;
      }
    }
  }

  return data;
};
