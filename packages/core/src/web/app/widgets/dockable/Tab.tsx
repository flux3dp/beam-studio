import { useContext, useMemo } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import type { IDockviewPanelHeaderProps } from 'dockview-react';

import { SelectedElementContext } from '@core/app/contexts/SelectedElementContext';
import type { TDynamicPanelKey } from '@core/app/stores/editorLayoutStore';
import { borderSize } from '@core/app/widgets/dockable/constants';
import { addFloatingPanel, removePanel } from '@core/app/widgets/dockable/utils';
import useI18n from '@core/helpers/useI18n';

import styles from './Tab.module.scss';

const Tab = ({ api: panelApi }: IDockviewPanelHeaderProps) => {
  const lang = useI18n();
  const { selectedElement } = useContext(SelectedElementContext);

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

  return (
    <div
      className={styles.tab}
      draggable
      onDragEndCapture={(e) => {
        console.log('Drag end captured', e);

        const width = (panelApi.group.width ?? 300) + borderSize;
        let height = (panelApi.group.height ?? 300) + borderSize;

        console.log('Current height:', height, width);

        if (panelApi.location.type !== 'floating') {
          height = Math.min(height, window.innerHeight / 2);
        }

        addFloatingPanel(panelApi.id, { height, width, x: e.clientX, y: e.clientY });
      }}
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
