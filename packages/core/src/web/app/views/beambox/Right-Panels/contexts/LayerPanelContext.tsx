import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { pipe } from 'remeda';

import { promarkModels } from '@core/app/actions/beambox/constant';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import doLayersContainsVector from '@core/helpers/layer/check-vector';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getLayerElementByName } from '@core/helpers/layer/layer-helper';
import useForceUpdate from '@core/helpers/use-force-update';

interface ILayerPanelContext {
  forceUpdate: () => void;
  forceUpdateSelectedLayers: () => void;
  hasGradient: boolean;
  hasVector: boolean;
  selectedLayers: string[];
  setSelectedLayers: (selectedLayers: string[]) => void;
}

export const LayerPanelContext = createContext<ILayerPanelContext>({
  forceUpdate: () => {},
  forceUpdateSelectedLayers: () => {},
  hasGradient: false,
  hasVector: false,
  selectedLayers: [],
  setSelectedLayers: () => {},
});

const layerPanelEventEmitter = eventEmitterFactory.createEventEmitter('layer-panel');

interface Props {
  children?: React.ReactNode;
}

export const LayerPanelContextProvider = ({ children }: Props): React.JSX.Element => {
  const [hasVector, setHasVector] = useState<boolean>(false);
  const [hasGradient, setHasGradient] = useState<boolean>(false);
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const forceUpdate = useForceUpdate();
  const forceUpdateSelectedLayers = useCallback(() => setSelectedLayers([...selectedLayers]), [selectedLayers]);
  const workarea = useWorkarea();
  const isPromark = useMemo(() => promarkModels.has(workarea), [workarea]);
  const lazySetSelectedLayers = useCallback(
    (newLayers: string[]) => {
      if (newLayers.length === selectedLayers.length && newLayers.every((name, i) => name === selectedLayers[i])) {
        return;
      }

      const isUvExportable = newLayers.every(
        (layerName) => getData(getLayerElementByName(layerName), 'module') === LayerModule.UV_EXPORT,
      );

      layerPanelEventEmitter.emit('updateUvExportStatus', isUvExportable);

      setSelectedLayers(newLayers);
    },
    [selectedLayers, setSelectedLayers],
  );

  useEffect(() => {
    layerPanelEventEmitter.on('UPDATE_LAYER_PANEL', forceUpdate);

    return () => {
      layerPanelEventEmitter.removeListener('UPDATE_LAYER_PANEL', forceUpdate);
    };
    // eslint-disable-next-line hooks/exhaustive-deps
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
      layerPanelEventEmitter.off('GET_SELECTED_LAYERS', getSelectedLayers);
      layerPanelEventEmitter.off('CHECK_VECTOR', checkVector);
    };
  }, [selectedLayers]);

  useEffect(() => {
    const checkGradient = () => {
      if (isPromark) {
        const newVal = selectedLayers.some((layerName: string) =>
          pipe(
            //
            layerName,
            getLayerElementByName,
            (layer) => layer?.querySelector('image[data-shading="true"]'),
            Boolean,
          ),
        );

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
  // eslint-disable-next-line hooks/exhaustive-deps
  useEffect(() => {
    const newVal = doLayersContainsVector(selectedLayers);

    if (hasVector !== newVal) {
      setHasVector(newVal);
    }

    if (isPromark) {
      const newGradientVal = selectedLayers.some((layerName: string) =>
        pipe(
          //
          layerName,
          getLayerElementByName,
          (layer) => layer?.querySelector('image[data-shading="true"]'),
          Boolean,
        ),
      );

      if (newGradientVal !== hasGradient) {
        setHasGradient(newGradientVal);
      }
    }
  });

  return (
    <LayerPanelContext.Provider
      value={{
        forceUpdate,
        forceUpdateSelectedLayers,
        hasGradient,
        hasVector,
        selectedLayers,
        setSelectedLayers: lazySetSelectedLayers,
      }}
    >
      {children}
    </LayerPanelContext.Provider>
  );
};
