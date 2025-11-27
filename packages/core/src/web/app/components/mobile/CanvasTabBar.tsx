import React, { useCallback, useEffect, useState } from 'react';

import { Badge } from 'antd';
import { TabBar } from 'antd-mobile';

import PreviewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import dialogCaller from '@core/app/actions/dialog-caller';
import { showPassThrough } from '@core/app/components/pass-through';
import FluxIcons from '@core/app/icons/flux/FluxIcons';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import TabBarIcons from '@core/app/icons/tab-bar/TabBarIcons';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import beamboxStore from '@core/app/stores/beambox-store';
import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { changeToPreviewMode, endPreviewMode, setupPreviewMode } from '@core/app/stores/canvas/utils/previewMode';
import historyUtils from '@core/app/svgedit/history/utils';
import createNewText from '@core/app/svgedit/text/createNewText';
import workareaManager from '@core/app/svgedit/workarea';
import ObjectPanelController from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import RightPanelController from '@core/app/views/beambox/Right-Panels/contexts/RightPanelController';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './CanvasTabBar.module.scss';

const events = eventEmitterFactory.createEventEmitter('canvas');
const rightPanelEventEmitter = eventEmitterFactory.createEventEmitter('right-panel');
let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface TabItem {
  badge?: boolean;
  disabled?: boolean;
  icon: React.JSX.Element;
  key: string;
  title: string;
}

const CanvasTabBar = (): React.ReactNode => {
  const isMobile = useIsMobile();
  const lang = useI18n();

  const { isClean, isDrawing, isPreviewMode } = useCameraPreviewStore();
  const [activeKey, setActiveKey] = useState('none');

  const resetActiveKey = useCallback(() => {
    setActiveKey('none');
  }, []);

  useEffect(() => {
    const handler = (val: boolean) => {
      setActiveKey((cur) => {
        if (val) {
          if (cur !== 'layer') {
            return 'layer';
          }

          return cur;
        }

        if (cur === 'layer') {
          return 'none';
        }

        return cur;
      });
    };

    rightPanelEventEmitter.on('DISPLAY_LAYER', handler);

    return () => {
      rightPanelEventEmitter.off('DISPLAY_LAYER', handler);
    };
  }, []);

  if (!isMobile) {
    return null;
  }

  const tabs: TabItem[] = [
    {
      icon: <TopBarIcons.Camera />,
      key: 'camera',
      title: lang.beambox.left_panel.label.choose_camera,
    },
    {
      icon: <TabBarIcons.Photo />,
      key: 'image',
      title: lang.beambox.left_panel.label.photo,
    },
    {
      icon: <TabBarIcons.Shape />,
      key: 'shape',
      title: lang.beambox.left_panel.label.elements,
    },
    {
      icon: <TabBarIcons.Text />,
      key: 'text',
      title: lang.beambox.left_panel.label.text,
    },
    {
      icon: (
        <div
          onClick={() => {
            if (activeKey === 'layer') {
              RightPanelController.setDisplayLayer(false);
            }
          }}
        >
          <TabBarIcons.Layers />
        </div>
      ),
      key: 'layer',
      title: lang.topbar.menu.layer_setting,
    },
    {
      icon: <TabBarIcons.Draw />,
      key: 'pen',
      title: lang.beambox.left_panel.label.pen,
    },
    {
      icon: <TabBarIcons.Boxgen />,
      key: 'boxgen',
      title: lang.beambox.left_panel.label.boxgen,
    },
    {
      icon: <TabBarIcons.Document />,
      key: 'document',
      title: lang.topbar.menu.document_setting_short,
    },
    {
      icon: <LeftPanelIcons.QRCode />,
      key: 'qrcode',
      title: lang.beambox.left_panel.label.qr_code,
    },
    {
      icon: <LeftPanelIcons.PassThrough />,
      key: 'passthrough',
      title: lang.beambox.left_panel.label.pass_through,
    },
    {
      icon: <div className={styles.sep} />,
      key: '',
      title: '',
    },
    {
      icon: <TopBarIcons.Undo />,
      key: 'undo',
      title: lang.topbar.menu.undo,
    },
    {
      icon: <TopBarIcons.Redo />,
      key: 'redo',
      title: lang.topbar.menu.redo,
    },
  ];

  const handleTabClick = (key: string) => {
    setMouseMode('select');

    if (key === 'layer') {
      RightPanelController.setDisplayLayer(true);
    } else {
      RightPanelController.setDisplayLayer(false);
    }

    if (key === 'camera') {
      changeToPreviewMode();

      if (!isPreviewMode) setupPreviewMode();

      setActiveKey('choose-preview-device');
      setTimeout(resetActiveKey, 300);
    } else if (key === 'image') {
      FnWrapper.importImage();
      setTimeout(resetActiveKey, 300);
    } else if (key === 'text') {
      events.once('addText', (newText: SVGTextElement) => {
        workareaManager.zoom((window.innerWidth / newText.getBBox().width) * 0.8);
        newText.scrollIntoView({ block: 'center', inline: 'center' });
        resetActiveKey();
      });
      createNewText(100, 100, { addToHistory: true, isToSelect: true, text: 'Text' });
    } else if (key === 'pen') {
      events.once('addPath', resetActiveKey);
      setMouseMode('path');
    } else if (key === 'undo') {
      historyUtils.undo();
      setTimeout(resetActiveKey, 300);
    } else if (key === 'redo') {
      historyUtils.redo();
      setTimeout(resetActiveKey, 300);
    } else if (key === 'shape') {
      dialogCaller.showElementPanel(resetActiveKey);
    } else if (key === 'document') {
      dialogCaller.showDocumentSettings();
      setTimeout(resetActiveKey, 300);
    } else if (key === 'passthrough') {
      showPassThrough(resetActiveKey);
    }
  };

  const previewTabItems: TabItem[] = [
    {
      icon: <TopBarIcons.Camera />,
      key: 'end-preview',
      title: lang.beambox.left_panel.label.end_preview,
    },
    {
      icon: <TabBarIcons.Shoot />,
      key: 'choose-preview-device',
      title: lang.beambox.left_panel.label.choose_camera,
    },
    {
      disabled: isDrawing || isClean,
      icon: <TabBarIcons.Trace />,
      key: 'image-trace',
      title: lang.beambox.left_panel.label.trace,
    },
    {
      disabled: isDrawing || isClean,
      icon: <TabBarIcons.Trash />,
      key: 'clear-preview',
      title: lang.beambox.left_panel.label.clear_preview,
    },
  ];
  const handlePreviewTabClick = (key: string) => {
    if (key === 'end-preview') {
      endPreviewMode();
    } else if (key === 'choose-preview-device') {
      if (!isPreviewMode) {
        setupPreviewMode();
      }
    } else if (key === 'image-trace') {
      endPreviewMode();
      beamboxStore.emitShowCropper();
    } else if (key === 'clear-preview') {
      if (!isClean) {
        PreviewModeBackgroundDrawer.resetCoordinates();
        PreviewModeBackgroundDrawer.clear();
      }
    }

    setTimeout(resetActiveKey, 300);
  };

  return (
    <div className={styles.container} id="mobile-tab-bar" onClick={() => ObjectPanelController.updateActiveKey(null)}>
      <div style={{ width: 'fit-content' }}>
        <TabBar
          activeKey={activeKey}
          onChange={(key) => {
            setActiveKey(key);

            if (isPreviewMode) {
              handlePreviewTabClick(key);
            } else {
              handleTabClick(key);
            }
          }}
        >
          {(isPreviewMode ? previewTabItems : tabs).map((item) => (
            <TabBar.Item
              aria-disabled={item.disabled || false}
              icon={
                item.badge ? (
                  <Badge
                    className={styles.badge}
                    count={item.badge ? <FluxIcons.FluxPlus className={styles['flux-plus']} /> : 0}
                    offset={[-4, 6]}
                  >
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )
              }
              key={item.key}
              title={item.title}
            />
          ))}
        </TabBar>
      </div>
    </div>
  );
};

export default CanvasTabBar;
