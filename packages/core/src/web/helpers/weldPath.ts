import paper from 'paper';

const weldPath = (pathD: string): string => {
  const proj = new paper.Project(document.createElement('canvas'));
  const subPaths = pathD
    .split('M')
    .filter((d) => d.split(' ').length > 4)
    .map((d) => `<path d="M${d}" />`);
  const items = proj.importSVG(`<svg>${subPaths.join('')}</svg>`);
  const objs = [...items.children] as (paper.Path | paper.CompoundPath)[];
  objs.sort((a, b) => Math.abs(b.area) - Math.abs(a.area));
  let basePath = objs[0] as paper.PathItem;
  const removeList = [];
  for (let i = 1; i < objs.length; i += 1) {
    const newPath = basePath.unite(objs[i]);
    const newPathArea = (newPath as paper.CompoundPath).area;

    // If the area of changes, the path is welded into the newPath, so we remove the old path
    if (Math.abs(Math.abs(newPathArea) - Math.abs((basePath as paper.CompoundPath).area)) > 1e-7)
      removeList.push(objs[i]);
    // else we keep the subpath, but we need to make sure the direction is correct (different to the main path)
    else if (Math.sign(newPathArea) === Math.sign(objs[i].area)) objs[i].reverse();
    basePath.remove();
    basePath = newPath;
  }
  removeList.forEach((obj) => obj.remove());
  const svg = proj.exportSVG() as SVGElement;
  const canvas = svg.children[0];
  const result = canvas.children[0];
  let pathData = '';
  for (let i = 0; i < result.children.length; i += 1) {
    const path = result.children[i];
    pathData += path.getAttribute('d');
  }
  return pathData;
};

export default weldPath;
