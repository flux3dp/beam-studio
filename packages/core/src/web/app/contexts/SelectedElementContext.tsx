import React, { createContext, memo, useCallback, useEffect, useRef, useState } from 'react';

import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

export interface SelectedElementContextType {
  selectedElement: Element | null;
}

export const SelectedElementContext = createContext<SelectedElementContextType>({
  selectedElement: null,
});

interface Props {
  children: React.ReactNode;
}

export const SelectedElementContextProvider = memo(({ children }: Props): React.JSX.Element => {
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const selectedElementRef = useRef<Element | null>(null);

  const handleSetSelectedElem = useCallback((elem: Element): void => {
    if (elem === selectedElementRef.current) {
      return;
    }

    selectedElementRef.current = elem;
    setSelectedElement((cur) => {
      if (cur === elem) {
        return cur;
      }

      (document.activeElement as HTMLInputElement).blur();

      return elem;
    });
  }, []);

  useEffect(() => {
    canvasEventEmitter.on('SET_SELECTED_ELEMENT', handleSetSelectedElem);

    return () => {
      canvasEventEmitter.off('SET_SELECTED_ELEMENT', handleSetSelectedElem);
    };
  }, [handleSetSelectedElem]);

  return <SelectedElementContext value={{ selectedElement }}>{children}</SelectedElementContext>;
});

export default {
  SelectedElementContext,
  SelectedElementContextProvider,
};
