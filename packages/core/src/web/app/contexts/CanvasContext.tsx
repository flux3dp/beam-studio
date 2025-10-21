import type { Dispatch, SetStateAction } from 'react';
import React, { createContext, useCallback, useEffect, useState } from 'react';

import { pick } from 'remeda';
import { match, P } from 'ts-pattern';
import { useShallow } from 'zustand/shallow';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { getPassThrough } from '@core/helpers/addOn';
import { discoverManager } from '@core/helpers/api/discover';
import deviceMaster from '@core/helpers/device-master';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useForceUpdate from '@core/helpers/use-force-update';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { IUser } from '@core/interfaces/IUser';

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');
const topBarEventEmitter = eventEmitterFactory.createEventEmitter('top-bar');
const fluxIDEventEmitter = eventEmitterFactory.createEventEmitter('flux-id');

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const workareaEvents = eventEmitterFactory.createEventEmitter('workarea');

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
  toggleAutoFocus: (forceState?: boolean) => Promise<void>;
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
  toggleAutoFocus: async () => {},
  updateCanvasContext: () => {},
});

const CanvasProvider = (props: React.PropsWithChildren<Record<string, unknown>>): React.JSX.Element => {
  const forceUpdate = useForceUpdate();
  const { mode, setMode } = useCanvasStore(useShallow((state) => pick(state, ['mode', 'setMode'])));
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

  useEffect(() => {
    const allLayers = document.querySelectorAll('g.layer') as unknown as SVGGElement[];

    // To prevent cursor changed to 'move' when 'mouseover'
    if ([CanvasMode.AutoFocus, CanvasMode.Preview].includes(mode)) {
      allLayers.forEach((g) => {
        g.style.pointerEvents = 'none';
      });
    } else {
      allLayers.forEach((g) => {
        g.style.pointerEvents = '';
      });
    }
  }, [mode]);

  const toggleAutoFocus = async (forceState?: boolean) => {
    const workarea = document.getElementById('workarea');
    const setCursor = (cursor: string) => {
      if (workarea) workarea.style.cursor = cursor;
    };

    await match({ forceState, mode })
      .with(P.union({ forceState: true }, { forceState: undefined, mode: P.not(CanvasMode.AutoFocus) }), () => {
        workareaEvents.emit('update-context-menu', { menuDisabled: true });
        $('#workarea').on('contextmenu', () => {
          toggleAutoFocus(false);

          return false;
        });

        setMode(CanvasMode.AutoFocus);
        svgCanvas.setMode('auto-focus');
        setCursor('url(img/auto-focus-cursor.svg) 16 12, cell');
      })
      .otherwise(async () => {
        await deviceMaster.rawLooseMotor();
        await deviceMaster.endSubTask();
        await deviceMaster.kick();

        $('#workarea').off('contextmenu');
        workareaEvents.emit('update-context-menu', { menuDisabled: false });

        setMode(CanvasMode.Draw);
        svgCanvas.setMode('select');
        setCursor('auto');
      });
  };

  const { children } = props;

  return (
    <CanvasContext.Provider
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
        toggleAutoFocus,
        updateCanvasContext,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export { CanvasContext, CanvasContextType, CanvasProvider };
