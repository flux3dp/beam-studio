import { getLayerElementByName } from 'helpers/layer/layer-helper';

const doElementContainVector = (elem: Element) => {
  const vectors = elem.querySelectorAll('path, rect, ellipse, polygon, line, text');
  let res = false;
  for (let i = 0; i < vectors.length; i += 1) {
    const vector = vectors[i];
    const fill = vector.getAttribute('fill');
    const fillOpacity = vector.getAttribute('fill-opacity');
    if (fill === 'none' || fill === '#FFF' || fill === '#FFFFFF' || fillOpacity === '0') {
      res = true;
      break;
    }
  }
  return res;
};

// TODO: add unit test
const doLayersContainsVector = (layerNames: string[]): boolean => {
  const layers = layerNames.map((layerName: string) => getLayerElementByName(layerName));
  let res = false;
  for (let i = 0; i < layers.length; i += 1) {
    const layer = layers[i];
    if (layer) {
      if (doElementContainVector(layer)) {
        res = true;
        break;
      }
      const uses = layer.querySelectorAll('use');
      for (let j = 0; j < uses.length; j += 1) {
        const use = uses[j];
        const href = use.getAttribute('xlink:href');
        let symbol = document.querySelector(href);
        if (symbol) {
          const originalSymbolID = symbol.getAttribute('data-origin-symbol');
          if (originalSymbolID) {
            const originalSymbol = document.getElementById(originalSymbolID);
            if (originalSymbol) symbol = originalSymbol;
          }
          if (symbol.getAttribute('data-wireframe') === 'true' || doElementContainVector(symbol)) {
            res = true;
            break;
          }
        }
      }
      if (res) break;
    }
  }
  return res;
};

export default doLayersContainsVector;
