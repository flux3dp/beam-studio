import React, { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

import beamboxPreference from 'app/actions/beambox/beambox-preference';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import isWeb from 'helpers/is-web';
import LayerPanel from 'app/components/beambox/right-panel/LayerPanel';
import ObjectPanel from 'app/views/beambox/Right-Panels/ObjectPanel';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import PathEditPanel from 'app/views/beambox/Right-Panels/PathEditPanel';
import Tab from 'app/components/beambox/right-panel/Tab';
import { CanvasContext } from 'app/contexts/CanvasContext';
import { ObjectPanelContextProvider } from 'app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import { PanelType } from 'app/constants/right-panel-types';
import { SelectedElementContext } from 'app/contexts/SelectedElementContext';
import { useIsMobile } from 'helpers/system-helper';

import styles from './RightPanel.module.scss';

const rightPanelEventEmitter = eventEmitterFactory.createEventEmitter('right-panel');
const beamboxPreferenceEventEmitter = eventEmitterFactory.createEventEmitter('beambox-preference');

const RightPanel = (): JSX.Element => {
  const { isPathEditing } = useContext(CanvasContext);
  const { selectedElement } = useContext(SelectedElementContext);
  const isMobile = useIsMobile();
  const [panelType, setPanelType] = useState<PanelType>(isMobile ? PanelType.None : PanelType.Layer);
  const autoSwitchTab = useRef<boolean>(beamboxPreference.read('auto-switch-tab'));

  useEffect(() => {
    rightPanelEventEmitter.on('SET_PANEL_TYPE', setPanelType);
    const handler = (val: boolean) => {
      autoSwitchTab.current = val;
    };
    beamboxPreferenceEventEmitter.on('auto-switch-tab', handler);
    return () => {
      rightPanelEventEmitter.off('SET_PANEL_TYPE', setPanelType);
      beamboxPreferenceEventEmitter.off('auto-switch-tab', handler);
    };
  }, []);

  useEffect(() => {
    const handler = (val: boolean) => {
      if (!isMobile) return;
      setPanelType((cur) => {
        if (val) {
          if (cur !== PanelType.Layer) return PanelType.Layer;
          return cur;
        }
        if (cur === PanelType.Layer) return PanelType.None;
        return cur;
      });
    };
     rightPanelEventEmitter.on('DISPLAY_LAYER', handler);
    return () => {
      rightPanelEventEmitter.off('DISPLAY_LAYER', handler);
    };
  }, [isMobile]);

  useEffect(() => {
    const hasElement = !!selectedElement;
    if (!isPathEditing) {
      if (isMobile) {
        setPanelType((cur) => {
          if (cur === PanelType.Layer) return cur;
          if (!hasElement && cur !== PanelType.None) return PanelType.None;
          if (hasElement && cur !== PanelType.Object) return PanelType.Object;
          return cur;
        });
      } else {
        setPanelType((cur) => {
          if (cur === PanelType.None || cur === PanelType.PathEdit) return PanelType.Layer;
          if (autoSwitchTab.current) return hasElement ? PanelType.Object : PanelType.Layer;
          return cur;
        });
      }
    } else setPanelType(PanelType.PathEdit);
  }, [isPathEditing, selectedElement, isMobile]);

  const switchPanel = useCallback(() => {
    setPanelType((cur) => {
      if (cur === PanelType.Layer || cur === PanelType.None) {
        return isPathEditing ? PanelType.PathEdit : PanelType.Object
      }
      return PanelType.Layer;
    });
  }, [isPathEditing]);

  const sideClass = classNames(styles.sidepanels, {
    [styles.short]: window.os === 'Windows' && !isWeb(),
    [styles.wide]: window.os !== 'MacOS',
  });
  return (
    <div id="right-panel" style={{ display: 'block' }}>
      <div id="sidepanels" className={sideClass}>
        <Tab panelType={panelType} switchPanel={switchPanel} />
        <ObjectPanelContextProvider>
          <ObjectPanelItem.Mask />
          {panelType === PanelType.PathEdit && <PathEditPanel />}
          <ObjectPanel hide={panelType !== PanelType.Object} />
          <LayerPanel hide={panelType !== PanelType.Layer} />
        </ObjectPanelContextProvider>
      </div>
    </div>
  );
};
export default memo(RightPanel);
