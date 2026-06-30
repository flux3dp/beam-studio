import React, { memo, useMemo } from 'react';

import classNames from 'classnames';

import FlexButton from '@core/app/components/beambox/RightPanel/common/FlexButton';
import IconButton from '@core/app/components/beambox/RightPanel/common/IconButton';
import { ObjectPanelItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import ListButtonGroup from '@core/app/components/common/ListButtonGroup';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { useLazyData, useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { useIsTabletOrMobile } from '@core/app/stores/screenStore';
import { mockT } from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';

import { convertAndBooleanOperate } from '../../utils/convertAndBooleanOperate';

import styles from './ToolPanel.module.scss';

const BooleanSection = () => {
  const lang = useI18n();
  const tObjectPanel = lang.beambox.right_panel.object_panel;
  const isTablet = useIsTabletOrMobile();
  const elem = useSelectedElementStore((state) => state.selectedElement);
  const elementCount = useSelectedElementStore((state) => state.elementCount);
  const isFillable = useLazyData('isFillable');
  const canBoolean = useMemo(() => elementCount > 1 && isFillable, [elementCount, isFillable]);
  const canBooleanSubtract = useMemo(() => elementCount === 2 && isFillable, [elementCount, isFillable]);

  const ToolButton = isTablet ? FlexButton : IconButton;
  const buttons = {
    difference: {
      disabled: !canBoolean,
      icon: <ObjectPanelIcons.Diff />,
      id: 'difference',
      label: tObjectPanel.difference,
      onClick: () => convertAndBooleanOperate({ element: elem as SVGGElement, operation: 'xor' }),
    },
    intersect: {
      disabled: !canBoolean,
      icon: <ObjectPanelIcons.Intersect />,
      id: 'intersect',
      label: tObjectPanel.intersect,
      onClick: () => convertAndBooleanOperate({ element: elem as SVGGElement, operation: 'intersect' }),
    },
    subtract: {
      disabled: !canBooleanSubtract,
      icon: <ObjectPanelIcons.Subtract />,
      id: 'subtract',
      label: tObjectPanel.subtract,
      onClick: () => convertAndBooleanOperate({ element: elem as SVGGElement, operation: 'diff' }),
    },
    union: {
      disabled: !canBoolean,
      icon: <ObjectPanelIcons.Union />,
      id: 'union',
      label: tObjectPanel.union,
      onClick: () => convertAndBooleanOperate({ element: elem as SVGGElement, operation: 'union' }),
    },
  };

  return isTablet ? (
    canBoolean && (
      <ObjectPanelItem
        icon={<ObjectPanelIcons.Subtract viewBox="4 4 16 16" />}
        id="boolean"
        renderContent={() => (
          <ListButtonGroup
            items={[buttons.union, buttons.subtract, buttons.intersect, buttons.difference].map((button) => ({
              ...button,
              children: button.label,
              type: 'default',
            }))}
            size="large"
          />
        )}
        title={mockT('布林運算')}
      />
    )
  ) : (
    <div className={classNames(styles.half, styles.right)}>
      <ToolButton {...buttons.union} />
      <ToolButton {...buttons.subtract} />
      <ToolButton {...buttons.intersect} />
      <ToolButton {...buttons.difference} />
    </div>
  );
};

export default memo(BooleanSection);
