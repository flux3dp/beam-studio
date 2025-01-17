import React, { useCallback, useEffect, useRef, useState } from 'react';

import eventEmitterFactory from 'helpers/eventEmitterFactory';
import useForceUpdate from 'helpers/use-force-update';

interface IObjectPanelContext {
  polygonSides: number;
  dimensionValues: any;
  activeKey: string | null;
  updateDimensionValues: (newValues: any) => void;
  getDimensionValues: (
    response: {
      dimensionValues: any;
    },
    key?: string
  ) => any;
  updateActiveKey: (activeKey: string | null) => void;
  updateObjectPanel: () => void;
}

export const ObjectPanelContext = React.createContext<IObjectPanelContext>({
  polygonSides: 5,
  dimensionValues: {},
  activeKey: null,
  updateDimensionValues: () => {},
  getDimensionValues: () => {},
  updateActiveKey: () => {},
  updateObjectPanel: () => {},
});
const objectPanelEventEmitter = eventEmitterFactory.createEventEmitter('object-panel');
const minRenderInterval = 200;

interface Props {
  children?: React.ReactNode;
}

export const ObjectPanelContextProvider = ({ children }: Props): JSX.Element => {
  const forceUpdate = useForceUpdate();
  const [polygonSides, setPolygonSides] = useState(5);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const dimensionValues = useRef<{ [key: string]: number | string }>({});
  const lastUpdateTime = useRef(Date.now());
  const updateTimeout = useRef<NodeJS.Timeout>(null);
  useEffect(() => {
    objectPanelEventEmitter.on('UPDATE_POLYGON_SIDES', setPolygonSides);
    objectPanelEventEmitter.on('UPDATE_ACTIVE_KEY', setActiveKey);
    return () => {
      objectPanelEventEmitter.removeListener('UPDATE_POLYGON_SIDES', setPolygonSides);
      objectPanelEventEmitter.removeListener('UPDATE_ACTIVE_KEY', setActiveKey);
    }
  }, []);

  const getDimensionValues = useCallback((response: { dimensionValues: any }, key?: string) => {
    response.dimensionValues = key ? dimensionValues.current[key] : dimensionValues.current;
  }, []);

  useEffect(() => {
    objectPanelEventEmitter.on('GET_DIMENSION_VALUES', getDimensionValues);
    return () => {
      objectPanelEventEmitter.removeListener('GET_DIMENSION_VALUES', getDimensionValues);
    }
  }, [getDimensionValues]);
  const updateDimensionValues = useCallback((newValues: { [key: string]: number | string }) => {
    dimensionValues.current = {
      ...dimensionValues.current,
      ...newValues,
    };
  }, []);

  useEffect(() => {
    objectPanelEventEmitter.on('UPDATE_DIMENSION_VALUES', updateDimensionValues);
    return () => {
      objectPanelEventEmitter.removeListener('UPDATE_DIMENSION_VALUES', updateDimensionValues);
    }
  }, [updateDimensionValues]);
  const getActiveKey = useCallback((response: { activeKey: string | null }) => {
    response.activeKey = activeKey;
  }, [activeKey]);

  useEffect(() => {
    objectPanelEventEmitter.on('GET_ACTIVE_KEY', getActiveKey);
    return () => {
      objectPanelEventEmitter.removeListener('GET_ACTIVE_KEY', getActiveKey);
    }
  }, [getActiveKey]);

  const updateObjectPanel = useCallback(() => {
    clearTimeout(updateTimeout.current);
    const time = Date.now();
    if (time - lastUpdateTime.current >= minRenderInterval) {
      lastUpdateTime.current = time;
      forceUpdate();
    } else {
      updateTimeout.current = setTimeout(() => {
        lastUpdateTime.current += minRenderInterval;
        forceUpdate();
      }, lastUpdateTime.current + minRenderInterval - time);
    }
  }, [forceUpdate]);
  useEffect(() => {
    objectPanelEventEmitter.on('UPDATE_OBJECT_PANEL', updateObjectPanel);
    return () => {
      objectPanelEventEmitter.removeListener('UPDATE_OBJECT_PANEL', updateObjectPanel);
    }
  }, [updateObjectPanel]);

  return (
    <ObjectPanelContext.Provider
      value={{
        polygonSides,
        dimensionValues: dimensionValues.current,
        activeKey,
        updateDimensionValues,
        getDimensionValues,
        updateActiveKey: setActiveKey,
        updateObjectPanel,
      }}
    >
      {children}
    </ObjectPanelContext.Provider>
  );
};
