import { memo, useEffect, useRef } from 'react';

import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { getBBox } from '@core/app/svgedit/utils/getBBox';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

type Props = {
  element: SVGGraphicsElement;
  fitToElement?: boolean;
  override?: { [key: string]: string };
};

const objectPanelEventEmitter = eventEmitterFactory.createEventEmitter('object-panel');

const createPreview = (
  svg: null | SVGSVGElement,
  element: SVGGraphicsElement,
  overrideAttr?: { [key: string]: string },
) => {
  if (!svg) return;

  const bbox = getBBox(element, { ignoreRotation: false });

  svg.innerHTML = '';
  svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);

  const clone = element.cloneNode(true) as typeof element;

  // Clear id
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));

  if (overrideAttr) {
    Object.entries(overrideAttr).forEach(([key, value]) => {
      clone.setAttribute(key, value);
    });
  }

  svg.appendChild(clone);
};

const ElementPreview = ({ element, override }: Props) => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    createPreview(ref.current, element, override);

    const updateOnChange = () => {
      if (useSelectedElementStore.getState().ungroupedElems.includes(element)) {
        createPreview(ref.current, element, override);
      }
    };

    objectPanelEventEmitter.on('UPDATE_OBJECT_PANEL', updateOnChange);

    return () => {
      objectPanelEventEmitter.off('UPDATE_OBJECT_PANEL', updateOnChange);
    };
  }, [element, override]);

  return <svg height="1em" ref={ref} width="1em" />;
};

export default memo(ElementPreview);
