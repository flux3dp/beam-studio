import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Badge } from 'antd';
import { TabBar } from 'antd-mobile';

import beamboxStore from 'app/stores/beambox-store';
import browser from 'implementations/browser';
import createNewText from 'app/svgedit/text/createNewText';
import dialogCaller from 'app/actions/dialog-caller';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import FluxIcons from 'app/icons/flux/FluxIcons';
import FnWrapper from 'app/actions/beambox/svgeditor-function-wrapper';
import historyUtils from 'app/svgedit/history/utils';
import LeftPanelIcons from 'app/icons/left-panel/LeftPanelIcons';
import ObjectPanelController from 'app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import PreviewModeBackgroundDrawer from 'app/actions/beambox/preview-mode-background-drawer';
import PreviewModeController from 'app/actions/beambox/preview-mode-controller';
import RightPanelController from 'app/views/beambox/Right-Panels/contexts/RightPanelController';
import TabBarIcons from 'app/icons/tab-bar/TabBarIcons';
import TopBarIcons from 'app/icons/top-bar/TopBarIcons';
import useI18n from 'helpers/useI18n';
import workareaManager from 'app/svgedit/workarea';
import { DmktIcon } from 'app/icons/icons';
import { CanvasContext } from 'app/contexts/CanvasContext';
import { CanvasMode } from 'app/constants/canvasMode';
import { getCurrentUser } from 'helpers/api/flux-id';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { showPassThrough } from 'app/components/pass-through/PassThrough';
import { useIsMobile } from 'helpers/system-helper';

import styles from './CanvasTabBar.module.scss';

const events = eventEmitterFactory.createEventEmitter('canvas');
const rightPanelEventEmitter = eventEmitterFactory.createEventEmitter('right-panel');
let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const CanvasTabBar = (): JSX.Element => {
  const isMobile = useIsMobile();
  const lang = useI18n();
  const isSubscribed = getCurrentUser()?.info?.subscription?.is_valid;

  const { mode, endPreviewMode, changeToPreviewMode, setupPreviewMode } = useContext(CanvasContext);
  const isPreviewing = mode === CanvasMode.Preview;
  const [activeKey, setActiveKey] = useState('none');

  const resetActiveKey = useCallback(() => {
    setActiveKey('none');
  }, []);

  useEffect(() => {
    const handler = (val: boolean) => {
      setActiveKey((cur) => {
        if (val) {
          if (cur !== 'layer') return 'layer';
          return cur;
        }
        if (cur === 'layer') return 'none';
        return cur;
      });
    };
    rightPanelEventEmitter.on('DISPLAY_LAYER', handler);
    return () => {
      rightPanelEventEmitter.off('DISPLAY_LAYER', handler);
    };
  }, []);
  if (!isMobile) return null;

  const tabs = [
    {
      key: 'camera',
      title: lang.beambox.left_panel.label.choose_camera,
      icon: <TopBarIcons.Camera />,
    },
    {
      key: 'image',
      title: lang.beambox.left_panel.label.photo,
      icon: <TabBarIcons.Photo />,
    },
    {
      key: 'cloud',
      title: lang.beambox.left_panel.label.my_cloud,
      icon: <LeftPanelIcons.Cloud />,
      badge: isSubscribed,
    },
    {
      key: 'shape',
      title: lang.beambox.left_panel.label.shapes,
      icon: <TabBarIcons.Shape />,
    },
    {
      key: 'text',
      title: lang.beambox.left_panel.label.text,
      icon: <TabBarIcons.Text />,
    },
    {
      key: 'layer',
      title: lang.topbar.menu.layer_setting,
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
    },
    {
      key: 'pen',
      title: lang.beambox.left_panel.label.pen,
      icon: <TabBarIcons.Draw />,
    },
    {
      key: 'boxgen',
      title: lang.beambox.left_panel.label.boxgen,
      icon: <TabBarIcons.Boxgen />,
    },
    {
      key: 'document',
      title: lang.topbar.menu.document_setting_short,
      icon: <TabBarIcons.Document />,
    },
    {
      key: 'qrcode',
      title: lang.beambox.left_panel.label.qr_code,
      icon: <LeftPanelIcons.QRCode />,
    },
    {
      key: 'dmkt',
      title: 'DMKT',
      icon: <DmktIcon style={{ fontSize: 40 }} />,
    },
    {
      key: 'passthrough',
      title: lang.beambox.left_panel.label.pass_through,
      icon: <LeftPanelIcons.PassThrough />,
    },
    {
      key: '',
      title: '',
      icon: <div className={styles.sep} />,
    },
    {
      key: 'undo',
      title: lang.topbar.menu.undo,
      icon: <TopBarIcons.Undo />,
    },
    {
      key: 'redo',
      title: lang.topbar.menu.redo,
      icon: <TopBarIcons.Redo />,
    },
  ];

  const handleTabClick = (key: string) => {
    svgCanvas.setMode('select');
    if (key === 'layer') {
      RightPanelController.setDisplayLayer(true);
    } else RightPanelController.setDisplayLayer(false);

    if (key === 'camera') {
      changeToPreviewMode();
      if (!PreviewModeController.isPreviewMode()) setupPreviewMode();
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
      createNewText(100, 100, { text: 'Text', addToHistory: true, isToSelect: true });
    } else if (key === 'pen') {
      events.once('addPath', resetActiveKey);
      FnWrapper.insertPath();
    } else if (key === 'undo') {
      historyUtils.undo();
      setTimeout(resetActiveKey, 300);
    } else if (key === 'redo') {
      historyUtils.redo();
      setTimeout(resetActiveKey, 300);
    } else if (key === 'shape') {
      dialogCaller.showShapePanel(resetActiveKey);
    } else if (key === 'document') {
      dialogCaller.showDocumentSettings();
      setTimeout(resetActiveKey, 300);
    } else if (key === 'dmkt') {
      browser.open(lang.topbar.menu.link.design_market);
      setTimeout(resetActiveKey, 300);
    } else if (key === 'cloud') {
      dialogCaller.showMyCloud(resetActiveKey);
    } else if (key === 'passthrough') {
      showPassThrough(resetActiveKey);
    }
  };

  const previewTabItems = [
    {
      key: 'end-preview',
      title: lang.beambox.left_panel.label.end_preview,
      icon: <TopBarIcons.Camera />,
    },
    {
      key: 'choose-preview-device',
      title: lang.beambox.left_panel.label.choose_camera,
      icon: <TabBarIcons.Shoot />,
    },
    {
      key: 'image-trace',
      title: lang.beambox.left_panel.label.trace,
      icon: <TabBarIcons.Trace />,
      disabled: PreviewModeController.isDrawing || PreviewModeBackgroundDrawer.isClean(),
    },
    {
      key: 'clear-preview',
      title: lang.beambox.left_panel.label.clear_preview,
      icon: <TabBarIcons.Trash />,
      disabled: PreviewModeController.isDrawing || PreviewModeBackgroundDrawer.isClean(),
    },
  ];
  const handlePreviewTabClick = (key: string) => {
    if (key === 'end-preview') {
      endPreviewMode();
    } else if (key === 'choose-preview-device') {
      if (!PreviewModeController.isPreviewMode()) {
        setupPreviewMode();
      }
    } else if (key === 'image-trace') {
      endPreviewMode();
      beamboxStore.emitShowCropper();
    } else if (key === 'clear-preview') {
      if (!PreviewModeBackgroundDrawer.isClean()) {
        PreviewModeBackgroundDrawer.resetCoordinates();
        PreviewModeBackgroundDrawer.clear();
      }
    }
    setTimeout(resetActiveKey, 300);
  };

  return (
    <div
      id="mobile-tab-bar"
      className={styles.container}
      onClick={() => ObjectPanelController.updateActiveKey(null)}
    >
      <div style={{ width: 'fit-content' }}>
        <TabBar
          activeKey={activeKey}
          onChange={(key) => {
            setActiveKey(key);
            if (isPreviewing) handlePreviewTabClick(key);
            else handleTabClick(key);
          }}
        >
          {(isPreviewing ? previewTabItems : tabs).map((item) => (
            <TabBar.Item
              key={item.key}
              icon={
                <Badge
                  className={styles.badge}
                  count={item.badge ? <FluxIcons.FluxPlus className={styles['flux-plus']} /> : 0}
                  offset={[-4, 6]}
                >
                  {item.icon}
                </Badge>
              }
              title={item.title}
              aria-disabled={item.disabled || false}
            />
          ))}
        </TabBar>
      </div>
    </div>
  );
};

export default CanvasTabBar;
