import { memo, useEffect, useMemo, useRef } from 'react';

import { funnel } from 'remeda';

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
  const isSelectedElement = useSelectedElementStore((state) => state.selectedElement === element);

  const updatePreview = useMemo(
    () =>
      funnel(() => createPreview(ref.current, element, override), {
        minQuietPeriodMs: 100,
        triggerAt: 'end',
      }).call,
    [ref, element, override],
  );

  useEffect(() => {
    updatePreview();

    const observer = new MutationObserver(() => updatePreview());

    observer.observe(element, { attributes: true, childList: true, subtree: true });

    if (isSelectedElement) {
      objectPanelEventEmitter.on('UPDATE_OBJECT_PANEL', updatePreview);
    }

    return () => {
      observer.disconnect();
      objectPanelEventEmitter.off('UPDATE_OBJECT_PANEL', updatePreview);
    };
  }, [element, override, isSelectedElement, updatePreview]);

  return <svg height="1em" ref={ref} width="1em" />;
};

export default memo(ElementPreview);
