import type { Dispatch, SetStateAction } from 'react';
import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';

import { match, P } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import PreviewModeController from '@core/app/actions/beambox/preview-mode-controller';
import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import curveEngravingModeController from '@core/app/actions/canvas/curveEngravingModeController';
import tabController from '@core/app/actions/tabController';
import { CanvasMode } from '@core/app/constants/canvasMode';
import tutorialConstants from '@core/app/constants/tutorial-constants';
import tutorialController from '@core/app/views/tutorials/tutorialController';
import { getPassThrough } from '@core/helpers/addOn';
import { getLatestDeviceInfo } from '@core/helpers/api/discover';
import showResizeAlert from '@core/helpers/device/fit-device-workarea-alert';
import getDevice from '@core/helpers/device/get-device';
import deviceMaster from '@core/helpers/device-master';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import shortcuts from '@core/helpers/shortcuts';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useForceUpdate from '@core/helpers/use-force-update';
import useI18n from '@core/helpers/useI18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { IUser } from '@core/interfaces/IUser';

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');
const topBarEventEmitter = eventEmitterFactory.createEventEmitter('top-bar');
const fluxIDEventEmitter = eventEmitterFactory.createEventEmitter('flux-id');
const workareaEventEmitter = eventEmitterFactory.createEventEmitter('workarea');

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const workareaEvents = eventEmitterFactory.createEventEmitter('workarea');

interface CanvasContextType {
  changeToPreviewMode: () => void;
  currentUser: IUser | null;
  endPreviewMode: () => void;
  hasPassthroughExtension: boolean;
  hasUnsavedChange: boolean;
  isColorPreviewing: boolean;
  isPathEditing: boolean;
  mode: CanvasMode;
  selectedDevice: IDeviceInfo | null;
  setIsColorPreviewing: (isColorPreviewing: boolean) => void;
  setIsPathEditing: (isPathEditing: boolean) => void;
  setMode: (mode: CanvasMode) => void;
  setSelectedDevice: Dispatch<SetStateAction<IDeviceInfo | null>>;
  setupPreviewMode: (opts?: { callback?: () => void; showModal?: boolean }) => void;
  toggleAutoFocus: (forceState?: boolean) => Promise<void>;
  togglePathPreview: () => void;
  updateCanvasContext: () => void;
}

const CanvasContext = createContext<CanvasContextType>({
  changeToPreviewMode: () => {},
  currentUser: null,
  endPreviewMode: () => {},
  hasPassthroughExtension: false,
  hasUnsavedChange: false,
  isColorPreviewing: false,
  isPathEditing: false,
  mode: CanvasMode.Draw,
  selectedDevice: null,
  setIsColorPreviewing: () => {},
  setIsPathEditing: () => {},
  setMode: () => {},
  setSelectedDevice: () => {},
  setupPreviewMode: () => {},
  toggleAutoFocus: async () => {},
  togglePathPreview: () => {},
  updateCanvasContext: () => {},
});

const CanvasProvider = (props: React.PropsWithChildren<Record<string, unknown>>): React.JSX.Element => {
  const lang = useI18n();
  const settingUpPreview = useRef(false);
  const forceUpdate = useForceUpdate();
  const [mode, setMode] = useState<CanvasMode>(CanvasMode.Draw);
  const [isColorPreviewing, setIsColorPreviewing] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [hasUnsavedChange, setHasUnsavedChange] = useState<boolean>(false);
  const [selectedDevice, setSelectedDevice] = useState<IDeviceInfo | null>(null);
  const [isPathEditing, setIsPathEditing] = useState<boolean>(false);
  const [hasPassthroughExtension, setHasPassthroughExtension] = useState<boolean>(false);
  const unregisterEndPreviewShortcut = useRef<(() => void) | null>(null);

  const endPreviewMode = (): void => {
    try {
      if (PreviewModeController.isPreviewMode) {
        PreviewModeController.end();
      }
    } catch (error) {
      console.log(error);
    } finally {
      if (tutorialController.getNextStepRequirement() === tutorialConstants.TO_EDIT_MODE) {
        tutorialController.handleNextStep();
      }

      // eslint-disable-next-line hooks/rules-of-hooks
      FnWrapper.useSelectTool();
      $('#workarea').off('contextmenu');
      workareaEventEmitter.emit('update-context-menu', { menuDisabled: false });

      // clear end preview shortcut after preview mode ended
      unregisterEndPreviewShortcut.current?.();
      unregisterEndPreviewShortcut.current = null;

      setMode(CanvasMode.Draw);
    }
  };

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
    const handler = (response: { mode: CanvasMode }): void => {
      response.mode = mode;
    };

    topBarEventEmitter.on('GET_CANVAS_MODE', handler);
    tabController.setMode(mode);

    return () => {
      topBarEventEmitter.removeListener('GET_CANVAS_MODE', handler);
    };
  }, [mode]);
  useEffect(() => {
    const handler = (response: { selectedDevice: IDeviceInfo | null }): void => {
      response.selectedDevice = getLatestDeviceInfo(selectedDevice?.uuid);
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
    canvasEventEmitter.on('SET_MODE', setMode);

    const canvasChangeHandler = () => setHasPassthroughExtension(getPassThrough());

    canvasChangeHandler();
    canvasEventEmitter.on('canvas-change', canvasChangeHandler);

    return () => {
      canvasEventEmitter.removeListener('SET_COLOR_PREVIEWING', setIsColorPreviewing);
      canvasEventEmitter.removeListener('SET_PATH_EDITING', setIsPathEditing);
      canvasEventEmitter.removeListener('SET_MODE', setMode);
      canvasEventEmitter.removeListener('canvas-change', canvasChangeHandler);
    };
  }, []);

  useEffect(() => {
    if (mode !== CanvasMode.CurveEngraving && curveEngravingModeController.started) {
      curveEngravingModeController.end();
    }

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

  const setupPreviewMode = useCallback(
    async (opts: { callback?: () => void; showModal?: boolean } = {}) => {
      if (settingUpPreview.current) {
        return;
      }

      settingUpPreview.current = true;

      const { callback, showModal } = opts;
      const { device, isWorkareaMatched } = await getDevice(showModal);

      if (!(await PreviewModeController.checkDevice(device))) {
        settingUpPreview.current = false;

        return;
      }

      if (!isWorkareaMatched && !(await showResizeAlert(device!))) {
        settingUpPreview.current = false;

        return;
      }

      const t = lang.topbar;
      const workarea = document.getElementById('workarea');
      const setCursor = (cursor: string) => {
        if (workarea) workarea.style.cursor = cursor;
      };

      // eslint-disable-next-line hooks/rules-of-hooks
      FnWrapper.useSelectTool();
      svgCanvas.clearSelection();
      setCursor('wait');

      try {
        await PreviewModeController.start(device!);

        if (!PreviewModeController.isPreviewMode) {
          setCursor('auto');
          settingUpPreview.current = false;

          return;
        }

        const triggerEndPreview = () => {
          endPreviewMode();
        };

        unregisterEndPreviewShortcut.current = shortcuts.on(['Escape'], triggerEndPreview, { isBlocking: true });

        setCursor('url(img/camera-cursor.svg) 9 12, cell');

        if (PreviewModeController.isFullScreen) {
          PreviewModeController.previewFullWorkarea(() => {
            if (tutorialController.getNextStepRequirement() === tutorialConstants.PREVIEW_PLATFORM) {
              tutorialController.handleNextStep();
            }
          });
        }

        setMode(CanvasMode.Preview);
        callback?.();
      } catch (error) {
        console.error(error);

        if (error instanceof Error) {
          if (error.message && error.message.startsWith('Camera WS')) {
            alertCaller.popUpError({
              message: `${t.alerts.fail_to_connect_with_camera}<br/>${error.message || ''}`,
            });
          } else {
            alertCaller.popUpError({
              message: `${t.alerts.fail_to_start_preview}<br/>${error.message || ''}`,
            });
          }
        }

        // eslint-disable-next-line hooks/rules-of-hooks
        FnWrapper.useSelectTool();
      } finally {
        settingUpPreview.current = false;
      }
    },
    [lang],
  );

  useEffect(() => {
    canvasEventEmitter.addListener('SETUP_PREVIEW_MODE', setupPreviewMode);

    return () => {
      canvasEventEmitter.removeListener('SETUP_PREVIEW_MODE', setupPreviewMode);
    };
  }, [setupPreviewMode]);

  const changeToPreviewMode = () => {
    svgCanvas.setMode('select');
    workareaEvents.emit('update-context-menu', { menuDisabled: true });

    const workarea = document.getElementById('workarea');
    const setCursor = (cursor: string) => {
      if (workarea) workarea.style.cursor = cursor;
    };

    $('#workarea').contextmenu(() => {
      endPreviewMode();

      return false;
    });
    setMode(CanvasMode.Preview);
    setCursor('url(img/camera-cursor.svg) 9 12, cell');

    if (tutorialController.getNextStepRequirement() === tutorialConstants.TO_PREVIEW_MODE) {
      tutorialController.handleNextStep();
    }
  };

  const togglePathPreview = () => {
    setMode(mode === CanvasMode.PathPreview ? CanvasMode.Draw : CanvasMode.PathPreview);
  };

  const toggleAutoFocus = async (forceState?: boolean) => {
    const workarea = document.getElementById('workarea');
    const setCursor = (cursor: string) => {
      if (workarea) workarea.style.cursor = cursor;
    };

    await match({ forceState, mode })
      .with(P.union({ forceState: true }, { forceState: P.not(true), mode: P.not(CanvasMode.AutoFocus) }), () => {
        setMode(CanvasMode.AutoFocus);
        svgCanvas.setMode('auto-focus');
        setCursor('url(img/auto-focus-cursor.svg) 16 12, cell');
      })
      .otherwise(async () => {
        await deviceMaster.endSubTask();
        await deviceMaster.kick();
        setMode(CanvasMode.Draw);
        svgCanvas.setMode('select');
        setCursor('auto');
      });
  };

  const { children } = props;

  return (
    <CanvasContext.Provider
      value={{
        changeToPreviewMode,
        currentUser,
        endPreviewMode,
        hasPassthroughExtension,
        hasUnsavedChange,
        isColorPreviewing,
        isPathEditing,
        mode,
        selectedDevice,
        setIsColorPreviewing,
        setIsPathEditing,
        setMode,
        setSelectedDevice,
        setupPreviewMode,
        toggleAutoFocus,
        togglePathPreview,
        updateCanvasContext,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export { CanvasContext, CanvasContextType, CanvasProvider };
