import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import { CanvasElements } from '@core/app/constants/canvasElements';
import { presetNames } from '@core/app/constants/presetNames';
import alertConfig from '@core/helpers/api/alert-config';
import i18n from '@core/helpers/i18n';
import { getData } from '@core/helpers/layer/layer-config-helper';

// default presets are stored by key and presetNames records what each one does; custom presets are
// stored by name and are not in presetNames, so a custom "my_cutting" does not match
export const isCutPreset = (configName?: string): boolean => {
  const preset = configName ? presetNames[configName]?.preset : undefined;

  return preset === 'cutting' || preset === 'kiss_cut';
};

// symbol content keeps the imported tags, so circle / polyline appear there though never on canvas
const shapeSelector = [...CanvasElements.fillableElems, 'circle', 'polyline'].join(', ');

// computed style sees class rules (Illustrator's .cls-1{fill:none}), inline style and inherited fill;
// the attribute fallback covers environments that don't map presentation attributes (jsdom)
const isFilled = (elem: Element): boolean => {
  const style = getComputedStyle(elem);
  const fill = style.fill || elem.getAttribute('fill') || 'black';
  const fillOpacity = style.fillOpacity || elem.getAttribute('fill-opacity');

  if (fill === 'none' || Number.parseFloat(fillOpacity ?? '1') === 0) return false;

  // same as Swiftray (mysvg-functions.h): alpha 0 or near-white (qGray > 248) is not engraved;
  // fluxsvg skips #fff / #ffffff. Gradients (url(...)) count as filled in both
  const [r, g, b, a = 1] = fill.match(/[\d.]+/g)?.map(Number) ?? [];

  if (!fill.startsWith('rgb') || r === undefined) return !/^(#fff|#ffffff|white)$/i.test(fill);

  return a !== 0 && (r * 11 + g * 16 + b * 5) / 32 <= 248;
};

// clipPath / mask children only shape other elements, they are never engraved themselves
const isEngravable = (elem: Element) => !elem.closest('clipPath, mask');

const doesContentContainFill = (root: Element): boolean =>
  Array.from(root.querySelectorAll(`image, ${shapeSelector}`)).some(
    (elem) => isEngravable(elem) && (elem.tagName === 'image' || isFilled(elem)),
  );

const getUseSymbol = (use: Element): Element | null => {
  const href = use.getAttribute('xlink:href') || use.getAttribute('href');
  const symbol = href ? document.querySelector(href) : null;
  // a use may point at its rasterized image symbol, the original symbol holds the real content
  const originId = symbol?.getAttribute('data-origin-symbol');

  return (originId && document.getElementById(originId)) || symbol;
};

export const doesLayerContainFill = (layer: Element): boolean => {
  // shapes inside the layer itself; symbol content lives in defs, outside the layer
  if (doesContentContainFill(layer)) return true;

  return Array.from(layer.querySelectorAll('use')).some((use) => {
    // wireframe imports ("nolayer") turn every symbol child into a stroke-only outline
    if (use.getAttribute('data-wireframe') === 'true') return false;

    const symbol = getUseSymbol(use);

    return Boolean(symbol && symbol.getAttribute('data-wireframe') !== 'true' && doesContentContainFill(symbol));
  });
};

export const hasCutLayerWithFill = (layers: Element[]): boolean =>
  layers.some((layer) => isCutPreset(getData(layer, 'configName')) && doesLayerContainFill(layer));

export const showCutLayerFillAlert = (): Promise<void> =>
  new Promise((resolve) => {
    if (alertConfig.read('skip-cut-layer-fill-warning')) {
      resolve();

      return;
    }

    alertCaller.popUp({
      callbacks: () => resolve(),
      checkbox: {
        callbacks: () => {
          alertConfig.write('skip-cut-layer-fill-warning', true);
          resolve();
        },
        text: i18n.lang.alert.dont_show_again,
      },
      id: 'cut-layer-fill-warning',
      message: i18n.lang.beambox.popup.cut_layer_contains_fill,
      // Esc closes through onClose only; closing is a dismiss, so the job continues
      onClose: () => resolve(),
      type: alertConstants.SHOW_POPUP_WARNING,
    });
  });
