import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import alertCaller from 'app/actions/alert-caller';
import beamboxPreference from 'app/actions/beambox/beambox-preference';
import curveEngravingModeController from 'app/actions/canvas/curveEngravingModeController';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import FnWrapper from 'app/actions/beambox/svgeditor-function-wrapper';
import getDevice from 'helpers/device/get-device';
import PreviewModeController from 'app/actions/beambox/preview-mode-controller';
import showResizeAlert from 'helpers/device/fit-device-workarea-alert';
import tabController from 'app/actions/tabController';
import tutorialConstants from 'app/constants/tutorial-constants';
import tutorialController from 'app/views/tutorials/tutorialController';
import useForceUpdate from 'helpers/use-force-update';
import useI18n from 'helpers/useI18n';
import workareaManager from 'app/svgedit/workarea';
import { CanvasMode } from 'app/constants/canvasMode';
import { getLatestDeviceInfo } from 'helpers/api/discover';
import { getSupportInfo } from 'app/constants/add-on';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { IDeviceInfo } from 'interfaces/IDevice';
import { IUser } from 'interfaces/IUser';
import shortcuts from 'helpers/shortcuts';

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');
const topBarEventEmitter = eventEmitterFactory.createEventEmitter('top-bar');
const fluxIDEventEmitter = eventEmitterFactory.createEventEmitter('flux-id');
const workareaEventEmitter = eventEmitterFactory.createEventEmitter('workarea');

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const workareaEvents = eventEmitterFactory.createEventEmitter('workarea');

interface CanvasContextType {
  changeToPreviewMode: () => void;
  currentUser: IUser;
  endPreviewMode: () => void;
  hasUnsavedChange: boolean;
  mode: CanvasMode;
  setMode: (mode: CanvasMode) => void;
  setupPreviewMode: (opts?: { showModal?: boolean; callback?: () => void }) => void;
  togglePathPreview: () => void;
  updateCanvasContext: () => void;
  selectedDevice: IDeviceInfo | null;
  setSelectedDevice: Dispatch<SetStateAction<IDeviceInfo | null>>;
  isColorPreviewing: boolean;
  setIsColorPreviewing: (isColorPreviewing: boolean) => void;
  isPathEditing: boolean;
  setIsPathEditing: (isPathEditing: boolean) => void;
  hasPassthroughExtension: boolean;
}

const CanvasContext = createContext<CanvasContextType>({
  changeToPreviewMode: () => {},
  currentUser: null,
  endPreviewMode: () => {},
  hasUnsavedChange: false,
  mode: CanvasMode.Draw,
  setMode: () => {},
  setupPreviewMode: () => {},
  togglePathPreview: () => {},
  updateCanvasContext: () => {},
  selectedDevice: null,
  setSelectedDevice: () => {},
  isColorPreviewing: false,
  setIsColorPreviewing: () => {},
  isPathEditing: false,
  setIsPathEditing: () => {},
  hasPassthroughExtension: false,
});

const CanvasProvider = (props: React.PropsWithChildren<Record<string, unknown>>): JSX.Element => {
  const lang = useI18n();
  const settingUpPreview = useRef(false);
  const forceUpdate = useForceUpdate();
  const [mode, setMode] = useState<CanvasMode>(CanvasMode.Draw);
  const [isColorPreviewing, setIsColorPreviewing] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<IUser>(null);
  const [hasUnsavedChange, setHasUnsavedChange] = useState<boolean>(false);
  const [selectedDevice, setSelectedDevice] = useState<IDeviceInfo | null>(null);
  const [isPathEditing, setIsPathEditing] = useState<boolean>(false);
  const [hasPassthroughExtension, setHasPassthroughExtension] = useState<boolean>(false);
  const unregisterEndPreviewShortcut = useRef<() => void | null>(null);

  const endPreviewMode = (): void => {
    try {
      if (PreviewModeController.isPreviewMode()) {
        PreviewModeController.end();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    } finally {
      if (tutorialController.getNextStepRequirement() === tutorialConstants.TO_EDIT_MODE) {
        tutorialController.handleNextStep();
      }

      // eslint-disable-next-line react-hooks/rules-of-hooks
      FnWrapper.useSelectTool();
      $('#workarea').off('contextmenu');
      workareaEventEmitter.emit('update-context-menu', { menuDisabled: false });

      // clear end preview shortcut after preview mode ended
      unregisterEndPreviewShortcut.current?.();
      unregisterEndPreviewShortcut.current = null;

      setMode(CanvasMode.Draw);
    }
  };

  const setUser = useCallback((user) => setCurrentUser({ ...user }), []);
  useEffect(() => {
    fluxIDEventEmitter.on('update-user', setUser);
    const handler = (e: CustomEvent) => {
      setUser(e.detail.user);
    };
    window.addEventListener('update-user', handler);
    return () => {
      fluxIDEventEmitter.removeListener('update-user', setUser);
      window.removeEventListener('update-user', handler);
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
    const handler = (response: { isPreviewMode: boolean }): void => {
      response.isPreviewMode = mode === CanvasMode.Preview;
    };
    topBarEventEmitter.on('GET_TOP_BAR_PREVIEW_MODE', handler);
    tabController.setMode(mode);
    return () => {
      topBarEventEmitter.removeListener('GET_TOP_BAR_PREVIEW_MODE', handler);
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
    const canvasChangeHandler = () =>
      setHasPassthroughExtension(
        beamboxPreference.read('pass-through') && getSupportInfo(workareaManager.model).passThrough
      );
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
    const allLayers = document.querySelectorAll('g.layer');
    for (let i = 0; i < allLayers.length; i += 1) {
      const g = allLayers[i] as SVGGElement;
      if (mode === CanvasMode.Preview) {
        g.style.pointerEvents = 'none';
      } else {
        g.style.pointerEvents = '';
      }
    }
  }, [mode]);

  const setupPreviewMode = useCallback(
    async (opts: { showModal?: boolean; callback?: () => void } = {}) => {
      if (settingUpPreview.current) return;

      settingUpPreview.current = true;

      const { showModal, callback } = opts;
      const { device, isWorkareaMatched } = await getDevice(showModal);

      if (!(await PreviewModeController.checkDevice(device))) {
        settingUpPreview.current = false;
        return;
      }

      if (!isWorkareaMatched && !(await showResizeAlert(device))) {
        settingUpPreview.current = false;
        return;
      }

      const t = lang.topbar;
      const workarea = document.getElementById('workarea');
      // eslint-disable-next-line react-hooks/rules-of-hooks
      FnWrapper.useSelectTool();
      svgCanvas.clearSelection();
      workarea.style.cursor = 'wait';

      const onPreviewError = (errMessage) => {
        if (errMessage === 'Timeout has occurred') {
          alertCaller.popUpError({
            message: t.alerts.start_preview_timeout,
          });
        } else {
          alertCaller.popUpError({
            message: `${t.alerts.fail_to_start_preview}<br/>${errMessage}`,
          });
        }
        setMode(CanvasMode.Draw);
        workarea.style.cursor = 'auto';
      };

      try {
        await PreviewModeController.start(device, onPreviewError);
        if (!PreviewModeController.isPreviewModeOn) {
          workarea.style.cursor = 'auto';
          settingUpPreview.current = false;
          return;
        }

        const triggerEndPreview = () => {
          endPreviewMode();
        };

        unregisterEndPreviewShortcut.current = shortcuts.on(['Escape'], triggerEndPreview, {
          isBlocking: true,
        });

        workarea.style.cursor = 'url(img/camera-cursor.svg) 9 12, cell';

        if (PreviewModeController.isFullScreen) {
          PreviewModeController.previewFullWorkarea(() => {
            updateCanvasContext();
            if (tutorialController.getNextStepRequirement() === tutorialConstants.PREVIEW_PLATFORM)
              tutorialController.handleNextStep();
          });
        }
        setMode(CanvasMode.Preview);
        callback?.();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        if (error.message && error.message.startsWith('Camera WS')) {
          alertCaller.popUpError({
            message: `${t.alerts.fail_to_connect_with_camera}<br/>${error.message || ''}`,
          });
        } else {
          alertCaller.popUpError({
            message: `${t.alerts.fail_to_start_preview}<br/>${error.message || ''}`,
          });
        }
        // eslint-disable-next-line react-hooks/rules-of-hooks
        FnWrapper.useSelectTool();
      } finally {
        settingUpPreview.current = false;
      }
    },
    [lang, updateCanvasContext]
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
    $('#workarea').contextmenu(() => {
      endPreviewMode();
      return false;
    });
    setMode(CanvasMode.Preview);
    if (workarea) {
      workarea.style.cursor = 'url(img/camera-cursor.svg) 9 12, cell';
    }
    if (tutorialController.getNextStepRequirement() === tutorialConstants.TO_PREVIEW_MODE) {
      tutorialController.handleNextStep();
    }
  };

  const togglePathPreview = () => {
    setMode(mode === CanvasMode.PathPreview ? CanvasMode.Draw : CanvasMode.PathPreview);
  };

  const { children } = props;
  return (
    <CanvasContext.Provider
      value={{
        changeToPreviewMode,
        currentUser,
        endPreviewMode,
        hasUnsavedChange,
        mode,
        setMode,
        setupPreviewMode,
        togglePathPreview,
        updateCanvasContext,
        selectedDevice,
        setSelectedDevice,
        isColorPreviewing,
        setIsColorPreviewing,
        isPathEditing,
        setIsPathEditing,
        hasPassthroughExtension,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export { CanvasContextType, CanvasContext, CanvasProvider };
