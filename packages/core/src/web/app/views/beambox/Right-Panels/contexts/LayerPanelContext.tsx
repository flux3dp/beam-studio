import React, { createContext, useEffect, useState, useCallback, useMemo } from 'react';

import doLayersContainsVector from 'helpers/layer/check-vector';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import useForceUpdate from 'helpers/use-force-update';
import useWorkarea from 'helpers/hooks/useWorkarea';
import { getLayerElementByName } from 'helpers/layer/layer-helper';
import { promarkModels } from 'app/actions/beambox/constant';

interface ILayerPanelContext {
  selectedLayers: string[];
  setSelectedLayers: (selectedLayers: string[]) => void;
  forceUpdate: () => void;
  forceUpdateSelectedLayers: () => void;
  hasVector: boolean;
  hasGradient: boolean;
}

export const LayerPanelContext = createContext<ILayerPanelContext>({
  selectedLayers: [],
  setSelectedLayers: () => {},
  forceUpdate: () => {},
  forceUpdateSelectedLayers: () => {},
  hasVector: false,
  hasGradient: false,
});
const layerPanelEventEmitter = eventEmitterFactory.createEventEmitter('layer-panel');

interface Props {
  children?: React.ReactNode;
}

export const LayerPanelContextProvider = ({ children }: Props): JSX.Element => {
  const [hasVector, setHasVector] = useState<boolean>(false);
  const [hasGradient, setHasGradient] = useState<boolean>(false);
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const forceUpdate = useForceUpdate();
  const forceUpdateSelectedLayers = useCallback(
    () => setSelectedLayers([...selectedLayers]),
    [selectedLayers]
  );
  const workarea = useWorkarea();
  const isPromark = useMemo(() => promarkModels.has(workarea), [workarea]);

  const lazySetSelectedLayers = useCallback(
    (newLayers: string[]) => {
      if (
        newLayers.length === selectedLayers.length &&
        newLayers.every((name, i) => name === selectedLayers[i])
      ) {
        return;
      }
      setSelectedLayers(newLayers);
    },
    [selectedLayers, setSelectedLayers]
  );

  useEffect(() => {
    layerPanelEventEmitter.on('UPDATE_LAYER_PANEL', forceUpdate);
    return () => {
      layerPanelEventEmitter.removeListener('UPDATE_LAYER_PANEL', forceUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    layerPanelEventEmitter.on('SET_SELECTED_LAYERS', lazySetSelectedLayers);
    return () => {
      layerPanelEventEmitter.removeListener('SET_SELECTED_LAYERS', lazySetSelectedLayers);
    };
  }, [lazySetSelectedLayers]);

  useEffect(() => {
    const getSelectedLayers = (response: { selectedLayers: string[] }) => {
      response.selectedLayers = selectedLayers;
    };
    layerPanelEventEmitter.on('GET_SELECTED_LAYERS', getSelectedLayers);
    const checkVector = () => {
      const newVal = doLayersContainsVector(selectedLayers);
      setHasVector(newVal);
    };
    layerPanelEventEmitter.on('CHECK_VECTOR', checkVector);
    return () => {
      layerPanelEventEmitter.removeListener('GET_SELECTED_LAYERS', getSelectedLayers);
      layerPanelEventEmitter.removeListener('CHECK_VECTOR', checkVector);
    };
  }, [selectedLayers]);

  useEffect(() => {
    const checkGradient = () => {
      if (isPromark) {
        const newVal = selectedLayers.some((layerName: string) => {
          const layer = getLayerElementByName(layerName);
          return !!layer?.querySelector('image[data-shading="true"]');
        });
        setHasGradient(newVal);
      }
    };
    checkGradient();
    layerPanelEventEmitter.on('CHECK_GRADIENT', checkGradient);
    return () => {
      layerPanelEventEmitter.removeListener('CHECK_GRADIENT', checkGradient);
    };
  }, [selectedLayers, isPromark]);

  // move doLayersContainsVector and setVector in effect to avoid heavy render process
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const newVal = doLayersContainsVector(selectedLayers);
    if (hasVector !== newVal) {
      setHasVector(newVal);
    }
    if (isPromark) {
      const newGradientVal = selectedLayers.some((layerName: string) => {
        const layer = getLayerElementByName(layerName);
        return !!layer?.querySelector('image[data-shading="true"]');
      });
      if (newGradientVal !== hasGradient) setHasGradient(newGradientVal);
    }
  });

  return (
    <LayerPanelContext.Provider
      value={{
        selectedLayers,
        setSelectedLayers: lazySetSelectedLayers,
        forceUpdate,
        forceUpdateSelectedLayers,
        hasVector,
        hasGradient,
      }}
    >
      {children}
    </LayerPanelContext.Provider>
  );
};
