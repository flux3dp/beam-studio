/* eslint-disable reactRefresh/only-export-components */
import React, { useCallback, useEffect, useRef, useState } from 'react';

import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import useForceUpdate from '@core/helpers/use-force-update';
import type { DimensionKey, DimensionValues } from '@core/interfaces/ObjectPanel';

interface IObjectPanelContext {
  activeKey: null | string;
  dimensionValues: any;
  getDimensionValues: (
    response: {
      dimensionValues: any;
    },
    key?: DimensionKey,
  ) => void;
  polygonSides: number;
  updateActiveKey: (activeKey: null | string) => void;
  updateDimensionValues: (newValues: DimensionValues) => void;
  updateObjectPanel: () => void;
}

export const ObjectPanelContext = React.createContext<IObjectPanelContext>({
  activeKey: null,
  dimensionValues: {},
  getDimensionValues: () => {},
  polygonSides: 5,
  updateActiveKey: () => {},
  updateDimensionValues: () => {},
  updateObjectPanel: () => {},
});

const objectPanelEventEmitter = eventEmitterFactory.createEventEmitter('object-panel');
const minRenderInterval = 200;

interface Props {
  children?: React.ReactNode;
}

export const ObjectPanelContextProvider = ({ children }: Props): React.JSX.Element => {
  const forceUpdate = useForceUpdate();
  const [polygonSides, setPolygonSides] = useState(5);
  const [activeKey, setActiveKey] = useState<null | string>(null);
  const dimensionValues = useRef<DimensionValues>({});
  const lastUpdateTime = useRef(Date.now());
  const updateTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    objectPanelEventEmitter.on('UPDATE_POLYGON_SIDES', setPolygonSides);
    objectPanelEventEmitter.on('UPDATE_ACTIVE_KEY', setActiveKey);

    return () => {
      objectPanelEventEmitter.removeListener('UPDATE_POLYGON_SIDES', setPolygonSides);
      objectPanelEventEmitter.removeListener('UPDATE_ACTIVE_KEY', setActiveKey);
    };
  }, []);

  const getDimensionValues = useCallback((response: { dimensionValues: any }, key?: DimensionKey) => {
    response.dimensionValues = key ? dimensionValues.current[key] : dimensionValues.current;
  }, []);

  useEffect(() => {
    objectPanelEventEmitter.on('GET_DIMENSION_VALUES', getDimensionValues);

    return () => {
      objectPanelEventEmitter.removeListener('GET_DIMENSION_VALUES', getDimensionValues);
    };
  }, [getDimensionValues]);

  const updateDimensionValues = useCallback((newValues: DimensionValues) => {
    dimensionValues.current = {
      ...dimensionValues.current,
      ...newValues,
    };
  }, []);

  useEffect(() => {
    objectPanelEventEmitter.on('UPDATE_DIMENSION_VALUES', updateDimensionValues);

    return () => {
      objectPanelEventEmitter.removeListener('UPDATE_DIMENSION_VALUES', updateDimensionValues);
    };
  }, [updateDimensionValues]);

  const getActiveKey = useCallback(
    (response: { activeKey: null | string }) => {
      response.activeKey = activeKey;
    },
    [activeKey],
  );

  useEffect(() => {
    objectPanelEventEmitter.on('GET_ACTIVE_KEY', getActiveKey);

    return () => {
      objectPanelEventEmitter.removeListener('GET_ACTIVE_KEY', getActiveKey);
    };
  }, [getActiveKey]);

  const updateObjectPanel = useCallback(() => {
    if (updateTimeout.current) clearTimeout(updateTimeout.current);

    const time = Date.now();

    if (time - lastUpdateTime.current >= minRenderInterval) {
      lastUpdateTime.current = time;
      forceUpdate();
    } else {
      updateTimeout.current = setTimeout(
        () => {
          lastUpdateTime.current += minRenderInterval;
          forceUpdate();
        },
        lastUpdateTime.current + minRenderInterval - time,
      );
    }
  }, [forceUpdate]);

  useEffect(() => {
    objectPanelEventEmitter.on('UPDATE_OBJECT_PANEL', updateObjectPanel);

    return () => {
      objectPanelEventEmitter.removeListener('UPDATE_OBJECT_PANEL', updateObjectPanel);
    };
  }, [updateObjectPanel]);

  return (
    <ObjectPanelContext.Provider
      value={{
        activeKey,
        dimensionValues: dimensionValues.current,
        getDimensionValues,
        polygonSides,
        updateActiveKey: setActiveKey,
        updateDimensionValues,
        updateObjectPanel,
      }}
    >
      {children}
    </ObjectPanelContext.Provider>
  );
};
