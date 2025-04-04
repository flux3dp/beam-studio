import beamboxPrefernce from '@core/app/actions/beambox/beambox-preference';
import NS from '@core/app/constants/namespaces';

const hexToRgb = (hexColorCode) => {
  const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColorCode);

  if (res) {
    return {
      b: Number.parseInt(res[3], 16),
      g: Number.parseInt(res[2], 16),
      r: Number.parseInt(res[1], 16),
    };
  }

  return { b: 0, g: 0, r: 0 };
};

// TODO: add test
const updateLayerColorFilter = (layer: SVGGElement): void => {
  const filter = Array.from(layer.childNodes).filter((child: Element) => child.tagName === 'filter')[0] as Element;

  if (layer?.getAttribute('data-fullcolor') === '1') {
    filter?.remove();

    return;
  }

  const useLayerColor = beamboxPrefernce.read('use_layer_color');
  const color = useLayerColor ? layer.getAttribute('data-color') : '#000';
  const { b, g, r } = hexToRgb(color);

  if (filter) {
    filter.setAttribute('id', `filter${color}`);

    let colorMatrix = Array.from(filter.childNodes).filter(
      (child: Element) => child.tagName === 'feColorMatrix',
    )[0] as Element;

    if (colorMatrix) {
      colorMatrix.setAttribute('values', `1 0 0 0 ${r / 255}, 0 1 0 0 ${g / 255}, 0 0 1 0 ${b / 255}, 0 0 0 1 0`);
    } else {
      colorMatrix = document.createElementNS(NS.SVG, 'feColorMatrix');
      colorMatrix.setAttribute('type', 'matrix');
      colorMatrix.setAttribute('values', `1 0 0 0 ${r / 255}, 0 1 0 0 ${g / 255}, 0 0 1 0 ${b / 255}, 0 0 0 1 0`);
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
    colorMatrix.setAttribute('values', `1 0 0 0 ${r / 255}, 0 1 0 0 ${g / 255}, 0 0 1 0 ${b / 255}, 0 0 0 1 0`);
    colorFilter.appendChild(colorMatrix);
    layer.appendChild(colorFilter);
  }
};

export default updateLayerColorFilter;
