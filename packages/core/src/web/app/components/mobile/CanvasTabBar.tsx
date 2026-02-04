import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge } from 'antd';
import { TabBar } from 'antd-mobile';
import { match, P } from 'ts-pattern';

import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import dialogCaller from '@core/app/actions/dialog-caller';
import { showPassThrough } from '@core/app/components/pass-through';
import FluxIcons from '@core/app/icons/flux/FluxIcons';
import GeneratorIcons from '@core/app/icons/generator/GeneratorIcons';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import { SettingsIcons } from '@core/app/icons/Settings/SettingsIcons';
import TabBarIcons from '@core/app/icons/tab-bar/TabBarIcons';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import historyUtils from '@core/app/svgedit/history/utils';
import createNewText from '@core/app/svgedit/text/createNewText';
import workareaManager from '@core/app/svgedit/workarea';
import ObjectPanelController from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import RightPanelController from '@core/app/views/beambox/Right-Panels/contexts/RightPanelController';
import { handlePreviewClick } from '@core/helpers/device/camera/previewMode';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import { showSettingsModal } from '../settings/modal/SettingsModal';

import styles from './CanvasTabBar.module.scss';

const events = eventEmitterFactory.createEventEmitter('canvas');
const rightPanelEventEmitter = eventEmitterFactory.createEventEmitter('right-panel');

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
  const { mouseMode, toggleDrawerMode } = useCanvasStore();
  const { isDrawing, isStarting } = useCameraPreviewStore();
  const [activeKey, setActiveKey] = useState('none');

  useEffect(() => {
    const key = match(mouseMode)
      .with(P.union('pre_preview', 'preview'), () => 'camera')
      .with(P.union('path', 'pathedit'), () => 'pen')
      .otherwise(() => 'none');

    setActiveKey(key);
  }, [mouseMode]);

  useEffect(() => {
    const handler = (val: boolean) => {
      setActiveKey((cur) =>
        match<[boolean, string]>([val, cur])
          .with([true, P._], () => 'layer')
          .with([P._, 'layer'], () => 'none')
          .otherwise(() => cur),
      );
    };

    rightPanelEventEmitter.on('DISPLAY_LAYER', handler);

    return () => {
      rightPanelEventEmitter.off('DISPLAY_LAYER', handler);
    };
  }, []);

  const resetActiveKey = useCallback(() => setActiveKey('none'), []);

  const handleTabClick = async (key: string) => {
    setMouseMode('select');
    RightPanelController.setDisplayLayer(key === 'layer');

    await match(key)
      .with('camera', async () => {
        if (!['pre_preview', 'preview'].includes(mouseMode)) {
          const res = await handlePreviewClick();

          if (!res) setActiveKey('none');
        }
      })
      .with('document', () => {
        dialogCaller.showDocumentSettings();
        setTimeout(resetActiveKey, 300);
      })
      .with('setting', () => {
        showSettingsModal();
        setTimeout(resetActiveKey, 300);
      })
      .with('image', () => {
        FnWrapper.importImage();
        setTimeout(resetActiveKey, 300);
      })
      .with('passthrough', () => showPassThrough(resetActiveKey))
      .with('pen', () => setMouseMode('path'))
      .with(P.union('redo', 'undo'), (action) => {
        historyUtils[action]();
        setTimeout(resetActiveKey, 300);
      })
      .with('shape', () => dialogCaller.showElementPanel(resetActiveKey))
      .with('ai-generate', () => {
        toggleDrawerMode('ai-generate');
        resetActiveKey();
      })
      .with('generator', () => {
        toggleDrawerMode('generator');
        resetActiveKey();
      })
      .with('text', () => {
        events.once('addText', (newText: SVGTextElement) => {
          workareaManager.zoom((window.innerWidth / newText.getBBox().width) * 0.8);
          newText.scrollIntoView({ block: 'center', inline: 'center' });
          resetActiveKey();
        });
        createNewText(100, 100, { addToHistory: true, isToSelect: true, text: 'Text' });
      })
      .otherwise(() => {});
  };

  const tabs: TabItem[] = useMemo(
    () => [
      {
        disabled: isDrawing || isStarting,
        icon: (
          <TopBarIcons.Camera
            onClick={() => {
              if (activeKey === 'camera') setMouseMode('select');
            }}
          />
        ),
        key: 'camera',
        title: lang.beambox.left_panel.label.choose_camera,
      },
      { icon: <TabBarIcons.Photo />, key: 'image', title: lang.beambox.left_panel.label.photo },
      { icon: <TabBarIcons.Shape />, key: 'shape', title: lang.beambox.left_panel.label.elements },
      { icon: <TabBarIcons.Text />, key: 'text', title: lang.beambox.left_panel.label.text },
      { icon: <LeftPanelIcons.AiGenerate />, key: 'ai-generate', title: lang.beambox.ai_generate.header.title },
      { icon: <GeneratorIcons.Generator />, key: 'generator', title: lang.generators.title },
      {
        icon: (
          <TabBarIcons.Layers
            onClick={() => {
              if (activeKey === 'layer') {
                RightPanelController.setDisplayLayer(false);
              }
            }}
          />
        ),
        key: 'layer',
        title: lang.topbar.menu.layer_setting,
      },
      { icon: <TabBarIcons.Draw />, key: 'pen', title: lang.beambox.left_panel.label.pen },
      { icon: <TabBarIcons.Document />, key: 'document', title: lang.topbar.menu.document_setting_short },
      { icon: <SettingsIcons.Setting />, key: 'setting', title: lang.settings.caption },
      { icon: <LeftPanelIcons.PassThrough />, key: 'passthrough', title: lang.beambox.left_panel.label.pass_through },
      { icon: <div className={styles.sep} />, key: '', title: '' },
      { icon: <TopBarIcons.Undo />, key: 'undo', title: lang.topbar.menu.undo },
      { icon: <TopBarIcons.Redo />, key: 'redo', title: lang.topbar.menu.redo },
    ],
    [activeKey, isDrawing, isStarting, lang],
  );

  if (!isMobile) return null;

  return (
    <div className={styles.container} id="mobile-tab-bar" onClick={() => ObjectPanelController.updateActiveKey(null)}>
      <div style={{ width: 'fit-content' }}>
        <TabBar
          activeKey={activeKey}
          onChange={(key) => {
            setActiveKey(key);
            handleTabClick(key);
          }}
        >
          {tabs.map((item) => (
            <TabBar.Item
              aria-disabled={item.disabled || false}
              icon={
                item.badge ? (
                  <Badge
                    className={styles.badge}
                    count={<FluxIcons.FluxPlus className={styles['flux-plus']} />}
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
