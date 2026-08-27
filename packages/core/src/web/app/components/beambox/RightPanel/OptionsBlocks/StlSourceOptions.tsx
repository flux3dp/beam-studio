import React, { useEffect, useMemo, useState } from 'react';

import { computePolygonPoints } from '@core/app/svgedit/polygon';
import {
  type ExtrusionSource,
  extrusionSourceEvents,
  getExtrusionSourceElement,
  parseExtrusionSource,
  setExtrusionSource,
} from '@core/app/svgedit/stl/extrusionSource';

import PolygonOptions from './PolygonOptions';
import RectOptions from './RectOptions';

interface Props {
  elem: Element;
}

const StlSourceOptions = ({ elem }: Props): null | React.JSX.Element => {
  const [source, setSource] = useState(() => parseExtrusionSource(elem));
  const sourceElem = useMemo(() => (source ? getExtrusionSourceElement(source) : null), [source]);

  useEffect(() => setSource(parseExtrusionSource(elem)), [elem]);
  useEffect(() => {
    const refresh = (id: string) => {
      if (id === elem.id) setSource(parseExtrusionSource(elem));
    };

    extrusionSourceEvents.on('changed', refresh);

    return () => {
      extrusionSourceEvents.off('changed', refresh);
    };
  }, [elem]);

  if (!source || !sourceElem) return null;

  const update = (mutate: (draft: SVGElement) => void) => {
    const draft = sourceElem.cloneNode(true) as SVGElement;

    mutate(draft);

    const next: ExtrusionSource = {
      ...source,
      markup: new XMLSerializer().serializeToString(draft),
    };

    setExtrusionSource(elem, next);
    setSource(next);
  };

  if (sourceElem.tagName.toLowerCase() === 'rect') {
    const radiusMm = Number(sourceElem.getAttribute('rx') || 0) * source.scale;

    return (
      <RectOptions
        elem={elem}
        roundedCorner={{
          onChange: (valueMm) => update((draft) => draft.setAttribute('rx', String(valueMm / source.scale))),
          valueMm: radiusMm,
        }}
      />
    );
  }

  if (sourceElem.tagName.toLowerCase() === 'polygon' && sourceElem.getAttribute('shape') === 'regularPoly') {
    const sides = Number(sourceElem.getAttribute('sides')) || 3;

    return (
      <PolygonOptions
        elem={elem}
        sideControl={{
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
        }}
      />
    );
  }

  return null;
};

export default StlSourceOptions;
