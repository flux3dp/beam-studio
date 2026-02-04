import type { ReactNode } from 'react';
import React, { memo, useCallback, useContext, useEffect, useState } from 'react';

import classNames from 'classnames';
import { match, P } from 'ts-pattern';

import LayerPanel from '@core/app/components/beambox/RightPanel/LayerPanel';
import Tab from '@core/app/components/beambox/RightPanel/Tab';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { PanelType } from '@core/app/constants/right-panel-types';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import { SelectedElementContext } from '@core/app/contexts/SelectedElementContext';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { ObjectPanelContextProvider } from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import ObjectPanel from '@core/app/views/beambox/Right-Panels/ObjectPanel';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import PathEditPanel from '@core/app/views/beambox/Right-Panels/PathEditPanel';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getOS } from '@core/helpers/getOS';
import isWeb from '@core/helpers/is-web';
import { useIsMobile } from '@core/helpers/system-helper';

import styles from './RightPanel.module.scss';

const rightPanelEventEmitter = eventEmitterFactory.createEventEmitter('right-panel');

const RightPanel = (): ReactNode => {
  const mode = useCanvasStore((state) => state.mode);
  const { isPathEditing } = useContext(CanvasContext);
  const { selectedElement } = useContext(SelectedElementContext);
  const isMobile = useIsMobile();
  const [panelType, setPanelType] = useState(isMobile ? PanelType.None : PanelType.Layer);
  const isTabAutoSwitch = useGlobalPreferenceStore((state) => state['auto-switch-tab']);

  useEffect(() => {
    rightPanelEventEmitter.on('SET_PANEL_TYPE', setPanelType);

    return () => {
      rightPanelEventEmitter.off('SET_PANEL_TYPE', setPanelType);
    };
  }, []);

  useEffect(() => {
    const handler = (isDisplayLayer: boolean) => {
      if (!isMobile) return;

      setPanelType((prevType) => {
        if (isDisplayLayer) {
          return prevType !== PanelType.Layer ? PanelType.Layer : prevType;
        }

        return prevType === PanelType.Layer ? PanelType.None : prevType;
      });
    };

    rightPanelEventEmitter.on('DISPLAY_LAYER', handler);

    return () => {
      rightPanelEventEmitter.off('DISPLAY_LAYER', handler);
    };
  }, [isMobile]);

  useEffect(() => {
    const hasElement = Boolean(selectedElement);

    if (!isPathEditing) {
      if (isMobile) {
        setPanelType((prevType) =>
          match({ hasElement, prevType })
            .with({ prevType: PanelType.Layer }, () => prevType)
            .with({ hasElement: false, prevType: P.not(PanelType.None) }, () => PanelType.None)
            .with({ hasElement: true, prevType: P.not(PanelType.Object) }, () => PanelType.Object)
            .otherwise(() => prevType),
        );
      } else {
        setPanelType((prevType) => {
          if ([PanelType.None, PanelType.PathEdit].includes(prevType)) {
            return PanelType.Layer;
          }

          if (isTabAutoSwitch) {
            return hasElement ? PanelType.Object : PanelType.Layer;
          }

          return prevType;
        });
      }
    } else {
      setPanelType(PanelType.PathEdit);
    }
  }, [isPathEditing, selectedElement, isMobile, isTabAutoSwitch]);

  const switchPanel = useCallback(() => {
    setPanelType((prevType) => {
      if ([PanelType.Layer, PanelType.None].includes(prevType)) {
        return isPathEditing ? PanelType.PathEdit : PanelType.Object;
      }

      return PanelType.Layer;
    });
  }, [isPathEditing]);

  if (mode === CanvasMode.PathPreview) return null;

  const osName = getOS();
  const sideClass = classNames(styles.sidepanels, {
    [styles.short]: osName === 'Windows' && !isWeb(),
    [styles.wide]: osName !== 'MacOS',
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
