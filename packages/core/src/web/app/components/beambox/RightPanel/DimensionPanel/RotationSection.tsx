import React, { memo, use, useCallback } from 'react';

import { RedoOutlined, UndoOutlined } from '@ant-design/icons';
import { Button as AntdButton } from 'antd';

import ControlBlock from '@core/app/components/beambox/RightPanel/common/ControlBlock';
import IconButton from '@core/app/components/beambox/RightPanel/common/IconButton';
import Row from '@core/app/components/beambox/RightPanel/common/Row';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import { resizeSelector } from '@core/app/svgedit/selector';
import { setRotationAngle } from '@core/app/svgedit/transform/rotation';
import { ControlType } from '@core/helpers/element/editable/base';
import useI18n from '@core/helpers/useI18n';
import type { DimensionValues } from '@core/interfaces/ObjectPanel';

import { ObjectPanelContext } from '../contexts/ObjectPanelContext';

import styles from './DimensionPanel.module.scss';
import Rotation from './Rotation';

interface Props {
  dimensionValues: DimensionValues;
  elem: SVGElement;
  forceUpdate: () => void;
}

const RotationSection = ({ dimensionValues, elem, forceUpdate }: Props): React.ReactNode => {
  const tObjectPanel = useI18n().beambox.right_panel.object_panel;
  const { updateDimensionValues } = use(ObjectPanelContext);
  const isTablet = useIsTabletOrMobile();

  const handleRotationChange = useCallback(
    (val: null | number, addToHistory = false): void => {
      if (!elem || val === null) return;

      const isTempGroup = elem.getAttribute('data-tempgroup') === 'true';
      let rotationDeg = val % 360;

      if (rotationDeg > 180) {
        rotationDeg -= 360;
      }

      let finalRotation = rotationDeg;

      if (isTempGroup && !addToHistory) {
        setRotationAngle(elem, rotationDeg, { addToHistory: false });
      } else {
        setRotationAngle(elem, rotationDeg, { addToHistory });

        if (isTempGroup) finalRotation = 0;
      }

      updateDimensionValues({ rotation: finalRotation });
      resizeSelector(elem);

      forceUpdate();
    },
    [elem, forceUpdate, updateDimensionValues],
  );

  const rotateBy = useCallback(
    (delta: number) => handleRotationChange((dimensionValues.rotation || 0) + delta, true),
    [handleRotationChange, dimensionValues.rotation],
  );

  const value = dimensionValues.rotation || 0;
  const Button = isTablet ? AntdButton : IconButton;
  const [input, negativeButton, positiveButton] = [
    <Rotation key="rot" onChange={handleRotationChange} value={value} />,
    <Button
      className={styles['rotate-btn']}
      icon={<UndoOutlined />}
      id="rotate_ccw_90"
      onClick={() => rotateBy(-90)}
      title="Rotate -90°"
    >
      90°
    </Button>,
    <Button
      className={styles['rotate-btn']}
      icon={<RedoOutlined />}
      id="rotate_cw_90"
      onClick={() => rotateBy(90)}
      title="Rotate +90°"
    >
      90°
    </Button>,
  ];

  return (
    <ControlBlock className={styles['full-row']} label={tObjectPanel.rotation} type={ControlType.ROTATION}>
      {isTablet ? (
        <Row>
          {negativeButton}
          {input}
          {positiveButton}
        </Row>
      ) : (
        <>
          {input}
          <div className={styles['rotate-btns']}>
            {negativeButton}
            {positiveButton}
          </div>
        </>
      )}
    </ControlBlock>
  );
};

export default memo(RotationSection);
