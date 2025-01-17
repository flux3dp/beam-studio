import beamboxPrefernce from 'app/actions/beambox/beambox-preference';
import NS from 'app/constants/namespaces';

const hexToRgb = (hexColorCode) => {
  const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColorCode);
  if (res) {
    return {
      r: parseInt(res[1], 16),
      g: parseInt(res[2], 16),
      b: parseInt(res[3], 16),
    };
  }
  return { r: 0, g: 0, b: 0 };
};

// TODO: add test
const updateLayerColorFilter = (layer: SVGGElement): void => {
  const filter = Array.from(layer.childNodes).filter(
    (child: Element) => child.tagName === 'filter'
  )[0] as Element;
  if (layer?.getAttribute('data-fullcolor') === '1') {
    filter?.remove();
    return;
  }
  const useLayerColor = beamboxPrefernce.read('use_layer_color');
  const color = useLayerColor ? layer.getAttribute('data-color') : '#000';
  const { r, g, b } = hexToRgb(color);
  if (filter) {
    filter.setAttribute('id', `filter${color}`);
    let colorMatrix = Array.from(filter.childNodes).filter(
      (child: Element) => child.tagName === 'feColorMatrix'
    )[0] as Element;
    if (colorMatrix) {
      colorMatrix.setAttribute(
        'values',
        `1 0 0 0 ${r / 255}, 0 1 0 0 ${g / 255}, 0 0 1 0 ${b / 255}, 0 0 0 1 0`
      );
    } else {
      colorMatrix = document.createElementNS(NS.SVG, 'feColorMatrix');
      colorMatrix.setAttribute('type', 'matrix');
      colorMatrix.setAttribute(
        'values',
        `1 0 0 0 ${r / 255}, 0 1 0 0 ${g / 255}, 0 0 1 0 ${b / 255}, 0 0 0 1 0`
      );
      filter.appendChild(colorMatrix);
    }
  } else {
    const colorFilter = document.createElementNS(NS.SVG, 'filter');
    const colorMatrix = document.createElementNS(NS.SVG, 'feColorMatrix');
    colorFilter.setAttribute('id', `filter${color}`);
    colorFilter.setAttribute('filterUnits', 'objectBoundingBox');
    colorFilter.setAttribute('primitiveUnits', 'userSpaceOnUse');
    colorFilter.setAttribute('color-interpolation-filters', 'sRGB');

    colorMatrix.setAttribute('type', 'matrix');
    colorMatrix.setAttribute(
      'values',
      `1 0 0 0 ${r / 255}, 0 1 0 0 ${g / 255}, 0 0 1 0 ${b / 255}, 0 0 0 1 0`
    );
    colorFilter.appendChild(colorMatrix);
    layer.appendChild(colorFilter);
  }
};

export default updateLayerColorFilter;
