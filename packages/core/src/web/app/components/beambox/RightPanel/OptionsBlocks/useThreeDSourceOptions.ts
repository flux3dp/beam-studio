import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { outlineText } from '@core/app/svgedit/operations/import/importStl/importText';
import { computePolygonPoints } from '@core/app/svgedit/polygon';
import {
  type ExtrusionSource,
  extrusionSourceEvents,
  getExtrusionSourceElement,
  parseExtrusionSource,
  setExtrusionSource,
} from '@core/app/svgedit/stl/extrusionSource';

interface ThreeDSourceOptions {
  onTextChange?: () => void;
  roundedCorner?: { onChange: (valueMm: number) => void; valueMm: number };
  sideControl?: { onChange: (nextSides: number) => void; value: number };
  sourceElem: null | SVGElement;
}

const useThreeDSourceOptions = (elem: Element | null): ThreeDSourceOptions => {
  const [source, setSource] = useState(() => (elem ? parseExtrusionSource(elem) : null));
  const sourceElem = useMemo(() => (source ? getExtrusionSourceElement(source) : null), [source]);
  const textUpdateId = useRef(0);

  useEffect(() => setSource(elem ? parseExtrusionSource(elem) : null), [elem]);
  useEffect(() => {
    const refresh = (id: string) => {
      if (elem && id === elem.id) setSource(parseExtrusionSource(elem));
    };

    extrusionSourceEvents.on('changed', refresh);

    return () => {
      extrusionSourceEvents.off('changed', refresh);
    };
  }, [elem]);
  useEffect(() => {
    if (!sourceElem || sourceElem.tagName.toLowerCase() !== 'text') return;

    // Text measurement APIs only work reliably in a rendered SVG document. Keep the retained
    // editable source offscreen while its regular TextOptions are mounted; the visible object is
    // still the mesh in the 3D canvas.
    const root = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    root.setAttribute('height', '10000');
    root.setAttribute('width', '10000');
    Object.assign(root.style, { left: '-100000px', position: 'absolute', top: '0' });
    root.appendChild(sourceElem);
    document.body.appendChild(root);

    return () => root.remove();
  }, [sourceElem]);

  const updateText = useCallback(async () => {
    if (!elem || !source || !sourceElem || sourceElem.tagName.toLowerCase() !== 'text') return;

    const updateId = ++textUpdateId.current;
    const geometryMarkup = await outlineText(sourceElem as SVGTextElement);

    if (!geometryMarkup || updateId !== textUpdateId.current) return;

    const next: ExtrusionSource = {
      ...source,
      geometryMarkup,
      markup: new XMLSerializer().serializeToString(sourceElem),
    };

    setExtrusionSource(elem, next, { mergeWithPreviousHistory: true, sourceElement: sourceElem });
    setSource(next);
  }, [elem, source, sourceElem]);

  const update = useCallback(
    (mutate: (draft: SVGElement) => void) => {
      if (!elem || !source || !sourceElem) return;

      const draft = sourceElem.cloneNode(true) as SVGElement;

      mutate(draft);

      const next: ExtrusionSource = {
        ...source,
        markup: new XMLSerializer().serializeToString(draft),
      };

      setExtrusionSource(elem, next);
      setSource(next);
    },
    [elem, source, sourceElem],
  );

  if (!source || !sourceElem) return { sourceElem: null };

  const tagName = sourceElem.tagName.toLowerCase();

  if (tagName === 'rect') {
    const radiusMm = Number(sourceElem.getAttribute('rx') || 0) * source.scale;

    return {
      roundedCorner: {
        onChange: (valueMm) => update((draft) => draft.setAttribute('rx', String(valueMm / source.scale))),
        valueMm: radiusMm,
      },
      sourceElem,
    };
  }

  if (tagName === 'polygon' && sourceElem.getAttribute('shape') === 'regularPoly') {
    const sides = Number(sourceElem.getAttribute('sides')) || 3;

    return {
      sideControl: {
        onChange: (nextSides) =>
          update((draft) => {
            const points = computePolygonPoints(
              Number(draft.getAttribute('cx')),
              Number(draft.getAttribute('cy')),
              Number(draft.getAttribute('edge')),
              Number(draft.getAttribute('angle_offset')),
              nextSides,
            );

            draft.setAttribute('points', points);
            draft.setAttribute('sides', String(nextSides));
          }),
        value: sides,
      },
      sourceElem,
    };
  }

  if (tagName === 'text') return { onTextChange: updateText, sourceElem };

  return { sourceElem };
};

export default useThreeDSourceOptions;
