import fontFuncs from '@core/app/actions/beambox/font-funcs';
import { getMaterial } from '@core/app/components/beambox/InnerEngraving/utils/material';
import { IDENTITY_TRANSFORM } from '@core/app/components/beambox/InnerEngraving/utils/transform';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import selectionManager from '@core/app/svgedit/selection';
import { STL_ATTR } from '@core/app/svgedit/stl/constants';
import { buildExtrusion, createExtrusionSource, serializeExtrusionSource } from '@core/app/svgedit/stl/extrusionSource';
import workareaManager from '@core/app/svgedit/workarea';

import { insertStlGeometry } from '.';

const DEPTH_MM = 1;

const createConversionRoot = (): SVGSVGElement => {
  const root = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  root.setAttribute('height', String(workareaManager.height));
  root.setAttribute('width', String(workareaManager.width));
  Object.assign(root.style, { left: '-100000px', position: 'absolute', top: '0' });
  document.body.appendChild(root);

  return root;
};

/** Build an outlined geometry snapshot while keeping the supplied text editable and untouched. */
export const outlineText = async (text: SVGTextElement): Promise<null | string> => {
  const root = createConversionRoot();
  const clone = text.cloneNode(true) as SVGTextElement;

  clone.id = `${text.id}-3d-conversion`;
  root.appendChild(clone);

  try {
    const { path } = await fontFuncs.convertTextToPath(clone, { isSubCommand: true, weldingTexts: true });

    return path ? new XMLSerializer().serializeToString(path) : null;
  } finally {
    root.remove();
  }
};

/** Convert an editable SVG text source to an outlined 1mm mesh. */
const importTextAsStl = async (text: SVGTextElement): Promise<boolean> => {
  if (!text.textContent || !text.parentNode) return false;

  const geometryMarkup = await outlineText(text);

  if (!geometryMarkup) {
    selectionManager.selectOnly([text]);
    setMouseMode('text');

    return false;
  }

  const source = {
    ...createExtrusionSource(text, { depth: DEPTH_MM, unit: 'scene' }),
    geometryMarkup,
  };

  const built = buildExtrusion(source);

  if (!built) return false;

  const position: [number, number, number] = [
    workareaManager.width / 2,
    workareaManager.height / 2,
    getMaterial().height / 2,
  ];
  const transform = { ...IDENTITY_TRANSFORM, position };

  await insertStlGeometry(
    built.buffer,
    built.geometry,
    { [STL_ATTR.source]: serializeExtrusionSource(source) },
    {
      initialTransform: transform,
      mergeWithPreviousHistory: true,
      replaceElement: text,
      skipFitPrompt: true,
    },
  );

  return true;
};

export default importTextAsStl;
