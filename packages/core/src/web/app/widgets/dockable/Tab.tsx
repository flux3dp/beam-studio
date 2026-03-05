import type { DragEvent } from 'react';
import { useCallback, useContext, useMemo, useRef } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import type { IDockviewPanelHeaderProps } from 'dockview-react';

import { SelectedElementContext } from '@core/app/contexts/SelectedElementContext';
import type { TDynamicPanelKey } from '@core/app/stores/dockableStore';
import useI18n from '@core/helpers/useI18n';

import { borderSize } from './constants';
import styles from './Tab.module.scss';
import { addFloatingPanel, removePanel, setMovedPanel } from './utils';

const Tab = ({ api: panelApi }: IDockviewPanelHeaderProps) => {
  const lang = useI18n();
  const { selectedElement } = useContext(SelectedElementContext);
  const tabRef = useRef<HTMLDivElement>(null);
  const tempElemRef = useRef<HTMLDivElement>(null);

  const title = useMemo(() => {
    const langRightPanel = lang.beambox.right_panel;
    const langTopBar = lang.topbar;
    let objectTitle = '';

    if (panelApi.component === 'rightPanelLayer') return `${langRightPanel.tabs.layers} (L)`;

    if (panelApi.component === 'rightPanelPath') return langRightPanel.tabs.path_edit;

    if (selectedElement) {
      if (selectedElement.getAttribute('data-tempgroup') === 'true') {
        objectTitle = langTopBar.tag_names.multi_select;
      } else if (selectedElement.getAttribute('data-textpath-g')) {
        objectTitle = langTopBar.tag_names.text_path;
      } else if (selectedElement.getAttribute('data-pass-through')) {
        objectTitle = langTopBar.tag_names.pass_through_object;
      } else if (selectedElement.tagName.toLowerCase() !== 'use') {
        objectTitle = langTopBar.tag_names[selectedElement.tagName.toLowerCase() as keyof typeof langTopBar.tag_names];
      } else if (selectedElement.getAttribute('data-svg') === 'true') {
        objectTitle = langTopBar.tag_names.svg;
      } else if (selectedElement.getAttribute('data-dxf') === 'true') {
        objectTitle = langTopBar.tag_names.dxf;
      } else {
        objectTitle = langTopBar.tag_names.use;
      }
    } else {
      objectTitle = langTopBar.tag_names.no_selection;
    }

    return `${objectTitle} (O)`;
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
      data-tab={panelApi.component}
      draggable
      onDragEndCapture={handleDragEnd}
      onDragStartCapture={handleDragStart}
      ref={tabRef}
      title={title}
    >
      <span className={styles.title}>{title}</span>
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
