import type { Dispatch, SetStateAction } from 'react';
import React, { createContext, useCallback, useEffect, useState } from 'react';

import { getPassThrough } from '@core/helpers/addOn';
import { discoverManager } from '@core/helpers/api/discover';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import useForceUpdate from '@core/helpers/use-force-update';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { IUser } from '@core/interfaces/IUser';

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');
const topBarEventEmitter = eventEmitterFactory.createEventEmitter('top-bar');
const fluxIDEventEmitter = eventEmitterFactory.createEventEmitter('flux-id');

interface CanvasContextType {
  currentUser: IUser | null;
  hasPassthroughExtension: boolean;
  hasUnsavedChange: boolean;
  isColorPreviewing: boolean;
  isPathEditing: boolean;
  selectedDevice: IDeviceInfo | null;
  setIsColorPreviewing: (isColorPreviewing: boolean) => void;
  setIsPathEditing: (isPathEditing: boolean) => void;
  setSelectedDevice: Dispatch<SetStateAction<IDeviceInfo | null>>;
  updateCanvasContext: () => void;
}

const CanvasContext = createContext<CanvasContextType>({
  currentUser: null,
  hasPassthroughExtension: false,
  hasUnsavedChange: false,
  isColorPreviewing: false,
  isPathEditing: false,
  selectedDevice: null,
  setIsColorPreviewing: () => {},
  setIsPathEditing: () => {},
  setSelectedDevice: () => {},
  updateCanvasContext: () => {},
});

const CanvasProvider = (props: React.PropsWithChildren<Record<string, unknown>>): React.JSX.Element => {
  const forceUpdate = useForceUpdate();
  const [isColorPreviewing, setIsColorPreviewing] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [hasUnsavedChange, setHasUnsavedChange] = useState<boolean>(false);
  const [selectedDevice, setSelectedDevice] = useState<IDeviceInfo | null>(null);
  const [isPathEditing, setIsPathEditing] = useState<boolean>(false);
  const [hasPassthroughExtension, setHasPassthroughExtension] = useState<boolean>(false);

  const setUser = useCallback((user: IUser | null) => setCurrentUser(user ? { ...user } : user), []);

  useEffect(() => {
    fluxIDEventEmitter.on('update-user', setUser);

    return () => {
      fluxIDEventEmitter.removeListener('update-user', setUser);
    };
  }, [setUser]);
  useEffect(() => {
    topBarEventEmitter.on('SET_HAS_UNSAVED_CHANGE', setHasUnsavedChange);
    topBarEventEmitter.on('SET_SELECTED_DEVICE', setSelectedDevice);

    return () => {
      topBarEventEmitter.removeListener('SET_HAS_UNSAVED_CHANGE', setHasUnsavedChange);
      topBarEventEmitter.removeListener('SET_SELECTED_DEVICE', setSelectedDevice);
    };
  }, []);
  useEffect(() => {
    const handler = (response: { selectedDevice: IDeviceInfo | null }): void => {
      response.selectedDevice = discoverManager.getLatestDeviceInfo(selectedDevice?.uuid);
    };

    topBarEventEmitter.on('GET_SELECTED_DEVICE', handler);

    return () => {
      topBarEventEmitter.removeListener('GET_SELECTED_DEVICE', handler);
    };
  }, [selectedDevice]);

  const updateCanvasContext = useCallback(() => {
    forceUpdate();
  }, [forceUpdate]);

  useEffect(() => {
    canvasEventEmitter.on('UPDATE_CONTEXT', updateCanvasContext); // This force rerender the context

    return () => {
      canvasEventEmitter.removeListener('UPDATE_CONTEXT', updateCanvasContext);
    };
  }, [updateCanvasContext]);

  useEffect(() => {
    canvasEventEmitter.on('SET_COLOR_PREVIEWING', setIsColorPreviewing);
    canvasEventEmitter.on('SET_PATH_EDITING', setIsPathEditing);

    const canvasChangeHandler = () => setHasPassthroughExtension(getPassThrough());

    canvasChangeHandler();
    canvasEventEmitter.on('canvas-change', canvasChangeHandler);

    return () => {
      canvasEventEmitter.removeListener('SET_COLOR_PREVIEWING', setIsColorPreviewing);
      canvasEventEmitter.removeListener('SET_PATH_EDITING', setIsPathEditing);
      canvasEventEmitter.removeListener('canvas-change', canvasChangeHandler);
    };
  }, []);

  const { children } = props;

  return (
    <CanvasContext
      value={{
        currentUser,
        hasPassthroughExtension,
        hasUnsavedChange,
        isColorPreviewing,
        isPathEditing,
        selectedDevice,
        setIsColorPreviewing,
        setIsPathEditing,
        setSelectedDevice,
        updateCanvasContext,
      }}
    >
      {children}
    </CanvasContext>
  );
};

export { CanvasContext, CanvasContextType, CanvasProvider };
