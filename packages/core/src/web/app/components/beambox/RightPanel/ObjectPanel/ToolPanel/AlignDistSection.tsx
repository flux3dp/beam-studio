import React, { memo } from 'react';

import classNames from 'classnames';

import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import FlexButton from '@core/app/components/beambox/RightPanel/common/FlexButton';
import IconButton from '@core/app/components/beambox/RightPanel/common/IconButton';
import Label from '@core/app/components/beambox/RightPanel/common/Label';
import { ObjectPanelItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import Row from '@core/app/components/beambox/RightPanel/common/Row';
import Divider from '@core/app/components/common/Divider';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { useIsTabletOrMobile } from '@core/app/stores/screenStore';
import { mockT } from '@core/helpers/is-dev';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import Content from '../../common/Content';

import styles from './ToolPanel.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const AlignDistSection = () => {
  const lang = useI18n();
  const tObjectPanel = lang.beambox.right_panel.object_panel;
  const isTablet = useIsTabletOrMobile();
  const canDistribute = useSelectedElementStore((state) => state.elementCount > 2);

  const ToolButton = isTablet ? FlexButton : IconButton;
  const buttons = {
    bottom_align: {
      icon: <ObjectPanelIcons.VAlignBot />,
      id: 'bottom_align',
      label: tObjectPanel.bottom_align,
      onClick: FnWrapper.alignBottom,
    },
    center_align: {
      icon: <ObjectPanelIcons.HAlignMid />,
      id: 'center_align',
      label: tObjectPanel.center_align,
      onClick: FnWrapper.alignCenter,
    },
    hdist: {
      disabled: !canDistribute,
      icon: <ObjectPanelIcons.HDist />,
      id: 'hdist',
      label: tObjectPanel.hdist,
      onClick: () => svgCanvas.distHori(),
    },
    left_align: {
      icon: <ObjectPanelIcons.HAlignLeft />,
      id: 'left_align',
      label: tObjectPanel.left_align,
      onClick: FnWrapper.alignLeft,
    },
    middle_align: {
      icon: <ObjectPanelIcons.VAlignMid />,
      id: 'middle_align',
      label: tObjectPanel.middle_align,
      onClick: FnWrapper.alignMiddle,
    },
    right_align: {
      icon: <ObjectPanelIcons.HAlignRight />,
      id: 'right_align',
      label: tObjectPanel.right_align,
      onClick: FnWrapper.alignRight,
    },
    top_align: {
      icon: <ObjectPanelIcons.VAlignTop />,
      id: 'top_align',
      label: tObjectPanel.top_align,
      onClick: FnWrapper.alignTop,
    },
    vdist: {
      disabled: !canDistribute,
      icon: <ObjectPanelIcons.VDist />,
      id: 'vdist',
      label: tObjectPanel.vdist,
      onClick: () => svgCanvas.distVert(),
    },
  };

  return isTablet ? (
    <ObjectPanelItem
      icon={<ObjectPanelIcons.VAlignMid viewBox="4 4 16 16" />}
      id="arrange"
      renderContent={() => (
        <Content>
          <div>
            <Label>{mockT('水平對齊')}</Label>
            <Row>
              <ToolButton {...buttons.left_align} />
              <ToolButton {...buttons.center_align} />
              <ToolButton {...buttons.right_align} />
            </Row>
          </div>
          <div>
            <Label>{mockT('垂直對齊')}</Label>
            <Row>
              <ToolButton {...buttons.top_align} />
              <ToolButton {...buttons.middle_align} />
              <ToolButton {...buttons.bottom_align} />
            </Row>
          </div>
          <Divider />
          <div>
            <Label>{mockT('分佈')}</Label>
            <Row>
              <ToolButton {...buttons.hdist} />
              <ToolButton {...buttons.vdist} />
            </Row>
          </div>
        </Content>
      )}
      title={mockT('對齊/分散')}
    />
  ) : (
    <div className={styles.row}>
      <div className={classNames(styles.half, styles.left, styles.sep)}>
        <ToolButton {...buttons.hdist} />
        <ToolButton {...buttons.top_align} />
        <ToolButton {...buttons.middle_align} />
        <ToolButton {...buttons.bottom_align} />
      </div>
      <div className={classNames(styles.half, styles.right)}>
        <ToolButton {...buttons.vdist} />
        <ToolButton {...buttons.left_align} />
        <ToolButton {...buttons.center_align} />
        <ToolButton {...buttons.right_align} />
      </div>
    </div>
  );
};

export default memo(AlignDistSection);
