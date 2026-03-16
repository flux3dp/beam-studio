import type { ReactNode } from 'react';
import React, { memo, use, useEffect, useState } from 'react';

import classNames from 'classnames';
import { match, P } from 'ts-pattern';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { PanelType } from '@core/app/constants/right-panel-types';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import { SelectedElementContext } from '@core/app/contexts/SelectedElementContext';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import type { TDynamicPanelKey } from '@core/app/stores/dockableStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { focusPanel, showPanel } from '@core/app/widgets/dockable/utils';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getOS } from '@core/helpers/getOS';
import { useIsMobile } from '@core/helpers/system-helper';

import LayerPanel from './LayerPanel';
import ObjectPanel from './ObjectPanel';
import ObjectPanelItem from './ObjectPanelItem';
import PathEditPanel from './PathEditPanel';
import styles from './RightPanel.module.scss';

const rightPanelEventEmitter = eventEmitterFactory.createEventEmitter('right-panel');

// TODO: Move panelType handler to another file
const RightPanel = (): ReactNode => {
  const mode = useCanvasStore((state) => state.mode);
  const { isPathEditing } = use(CanvasContext);
  const { selectedElement } = use(SelectedElementContext);
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

  useEffect(() => {
    const panelIdMap: Partial<Record<PanelType, TDynamicPanelKey>> = {
      [PanelType.Layer]: 'panelLayerControls',
      [PanelType.Object]: 'panelObjectProperties',
      [PanelType.PathEdit]: 'panelPathEdit',
    };
    const panelId = panelIdMap[panelType] ?? null;

    if (panelId) {
      if (panelId === 'panelPathEdit') showPanel(panelId);
      else focusPanel(panelId);
    }
  }, [panelType]);

  if (mode === CanvasMode.PathPreview) return null;

  // Note: keep RightPanel for non-mobile to handle panel type changes without displaying it
  if (!isMobile) return null;

  const osName = getOS();
  const sideClass = classNames(styles.sidepanels, {
    [styles.wide]: osName !== 'MacOS',
  });

  return (
    <div style={{ display: 'block' }}>
      <div className={sideClass}>
        <ObjectPanelItem.Mask />
        {panelType === PanelType.PathEdit && <PathEditPanel />}
        <ObjectPanel hide={panelType !== PanelType.Object} />
        <LayerPanel hide={panelType !== PanelType.Layer} />
      </div>
    </div>
  );
};

export default memo(RightPanel);
