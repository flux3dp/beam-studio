import React, { memo } from 'react';

import classNames from 'classnames';
import { useShallow } from 'zustand/shallow';

import IconButton from '@core/app/components/beambox/RightPanel/common/IconButton';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './ToolPanel.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const GroupSection = () => {
  const lang = useI18n();
  const tObjectPanel = lang.beambox.right_panel.object_panel;
  const groupAvailability = useSelectedElementStore(
    useShallow((state) => ({ group: state.canGroup, ungroup: state.canUngroup })),
  );
  const buttons = {
    group: {
      disabled: !groupAvailability.group,
      icon: <ObjectPanelIcons.Group />,
      id: 'group',
      label: tObjectPanel.group,
      onClick: () => svgCanvas.groupSelectedElements(),
    },
    ungroup: {
      disabled: !groupAvailability.ungroup,
      icon: <ObjectPanelIcons.Ungroup />,
      id: 'ungroup',
      label: tObjectPanel.ungroup,
      onClick: () => svgCanvas.ungroupSelectedElement(),
    },
  };

  return (
    <div className={classNames(styles.half, styles.left)}>
      <IconButton {...buttons.group} />
      <IconButton {...buttons.ungroup} />
    </div>
  );
};

export default memo(GroupSection);
