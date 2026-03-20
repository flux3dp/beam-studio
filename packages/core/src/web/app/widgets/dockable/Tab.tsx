import type { DragEvent } from 'react';
import React, { useCallback, useContext, useMemo, useRef } from 'react';

import Icon, { CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import type { IDockviewPanelHeaderProps } from 'dockview';

import tutorialController from '@core/app/components/tutorials/tutorialController';
import tutorialConstants from '@core/app/constants/tutorial-constants';
import { SelectedElementContext } from '@core/app/contexts/SelectedElementContext';
import ActionPanelIcons from '@core/app/icons/action-panel/ActionPanelIcons';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import TabBarIcons from '@core/app/icons/tab-bar/TabBarIcons';
import type { TDynamicPanelKey } from '@core/app/stores/dockableStore';
import { isFitText } from '@core/app/svgedit/text/textedit/getters';
import useI18n from '@core/helpers/useI18n';

import { borderSize } from './constants';
import styles from './Tab.module.scss';
import { addFloatingPanel, removePanel, setMovedPanel } from './utils';

const Tab = ({ api: panelApi }: IDockviewPanelHeaderProps) => {
  const lang = useI18n();
  const { selectedElement } = useContext(SelectedElementContext);
  const tabRef = useRef<HTMLDivElement>(null);
  const tempElemRef = useRef<HTMLDivElement>(null);

  const [icon, title, tutorialKey] = useMemo(() => {
    const { menu: tMenu, tag_names: tTag } = lang.topbar;
    let objectTitle = '';

    if (panelApi.component === 'rightPanelLayer') {
      return [TabBarIcons.Layers, `${tMenu.tab_layers} (L)`, tutorialConstants.TO_LAYER_PANEL];
    }

    if (panelApi.component === 'rightPanelPath') {
      return [ActionPanelIcons.EditPath, tMenu.tab_path_edit, null];
    }

    if (selectedElement) {
      if (selectedElement.getAttribute('data-tempgroup') === 'true') {
        objectTitle = tTag.multi_select;
      } else if (selectedElement.getAttribute('data-textpath-g')) {
        objectTitle = tTag.text_path;
      } else if (isFitText(selectedElement)) {
        objectTitle = tTag.fit_text;
      } else if (selectedElement.getAttribute('data-pass-through')) {
        objectTitle = tTag.pass_through_object;
      } else if (selectedElement.tagName.toLowerCase() !== 'use') {
        objectTitle = tTag[selectedElement.tagName.toLowerCase() as keyof typeof tTag];
      } else if (selectedElement.getAttribute('data-svg') === 'true') {
        objectTitle = tTag.svg;
      } else if (selectedElement.getAttribute('data-dxf') === 'true') {
        objectTitle = tTag.dxf;
      } else {
        objectTitle = tTag.use;
      }
    } else {
      objectTitle = tTag.no_selection;
    }

    return [ObjectPanelIcons.Parameter, `${objectTitle} (O)`, tutorialConstants.TO_OBJECT_PANEL];
  }, [lang, panelApi.component, selectedElement]);

  const handleDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      setMovedPanel(panelApi);
      tempElemRef.current?.remove();

      if (!e.dataTransfer || !tabRef.current) return;

      const container = tabRef.current.closest('.dv-groupview')!.parentElement as HTMLDivElement;
      const testElement = container.cloneNode(true) as HTMLDivElement;

      testElement.style.position = 'absolute';
      testElement.style.zIndex = '-9999';
      testElement.style.top = '0px'; // This is required for floating panel
      testElement.querySelectorAll('.dv-tab.dv-inactive-tab').forEach((tab) => tab.remove());
      (container.parentElement ?? document.body).appendChild(testElement);
      tempElemRef.current = testElement;

      // Override setDragImage to use custom element, will be called by dockview's drag handlers later
      const originalSetDragImage = e.dataTransfer.setDragImage.bind(e.dataTransfer);

      e.dataTransfer.setDragImage = () => {
        console.log('Intercepted setDragImage call, using custom element', testElement);
        originalSetDragImage(testElement, 0, 0);
      };
    },
    [panelApi],
  );

  const handleDragEnd = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      tempElemRef.current?.remove();

      const width = (panelApi.group.width ?? 300) + borderSize;
      let height = (panelApi.group.height ?? 300) + borderSize;

      if (panelApi.location.type !== 'floating') {
        height = Math.min(height, window.innerHeight / 2);
      }

      addFloatingPanel(panelApi.id, { height, width, x: e.clientX, y: e.clientY });
    },
    [panelApi],
  );

  return (
    <div
      className={styles.tab}
      draggable
      id={`${panelApi.component}-tab`}
      onClick={() => {
        if (tutorialKey && tutorialController.getNextStepRequirement() === tutorialKey) {
          tutorialController.handleNextStep();
        }
      }}
      onDragEndCapture={handleDragEnd}
      onDragStartCapture={handleDragStart}
      ref={tabRef}
      title={title}
    >
      <Icon className={styles.icon} component={icon} />
      <span>{title}</span>
      <Button
        className={styles.action}
        icon={<CloseOutlined />}
        onClick={() => removePanel(panelApi.id as TDynamicPanelKey)}
        size="small"
        type="text"
      />
    </div>
  );
};

export default Tab;
