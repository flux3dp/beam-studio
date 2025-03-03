import React, { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';

import classNames from 'classnames';

import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import LayerPanel from '@core/app/components/beambox/right-panel/LayerPanel';
import Tab from '@core/app/components/beambox/right-panel/Tab';
import { PanelType } from '@core/app/constants/right-panel-types';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import { SelectedElementContext } from '@core/app/contexts/SelectedElementContext';
import { ObjectPanelContextProvider } from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import ObjectPanel from '@core/app/views/beambox/Right-Panels/ObjectPanel';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import PathEditPanel from '@core/app/views/beambox/Right-Panels/PathEditPanel';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import isWeb from '@core/helpers/is-web';
import { useIsMobile } from '@core/helpers/system-helper';

import styles from './RightPanel.module.scss';

const rightPanelEventEmitter = eventEmitterFactory.createEventEmitter('right-panel');
const beamboxPreferenceEventEmitter = eventEmitterFactory.createEventEmitter('beambox-preference');

const RightPanel = (): React.JSX.Element => {
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
      if (!isMobile) {
        return;
      }

      setPanelType((cur) => {
        if (val) {
          if (cur !== PanelType.Layer) {
            return PanelType.Layer;
          }

          return cur;
        }

        if (cur === PanelType.Layer) {
          return PanelType.None;
        }

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
          if (cur === PanelType.Layer) {
            return cur;
          }

          if (!hasElement && cur !== PanelType.None) {
            return PanelType.None;
          }

          if (hasElement && cur !== PanelType.Object) {
            return PanelType.Object;
          }

          return cur;
        });
      } else {
        setPanelType((cur) => {
          if (cur === PanelType.None || cur === PanelType.PathEdit) {
            return PanelType.Layer;
          }

          if (autoSwitchTab.current) {
            return hasElement ? PanelType.Object : PanelType.Layer;
          }

          return cur;
        });
      }
    } else {
      setPanelType(PanelType.PathEdit);
    }
  }, [isPathEditing, selectedElement, isMobile]);

  const switchPanel = useCallback(() => {
    setPanelType((cur) => {
      if (cur === PanelType.Layer || cur === PanelType.None) {
        return isPathEditing ? PanelType.PathEdit : PanelType.Object;
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
      <div className={sideClass} id="sidepanels">
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
