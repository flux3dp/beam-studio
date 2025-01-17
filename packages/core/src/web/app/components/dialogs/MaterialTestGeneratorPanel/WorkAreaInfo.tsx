import React, { useMemo } from 'react';

import useI18n from 'helpers/useI18n';
import { Tooltip } from 'antd';
import { sprintf } from 'sprintf-js';
import { getWorkarea } from 'app/constants/workarea-constants';
import layerModuleHelper from 'helpers/layer-module/layer-module-helper';
import moduleBoundary from 'app/constants/layer-module/module-boundary';
import LayerModule from 'app/constants/layer-module/layer-modules';
import { QuestionCircleOutlined } from '@ant-design/icons';
import useWorkarea from 'helpers/hooks/useWorkarea';
import styles from './WorkAreaInfo.module.scss';

interface Props {
  isInch: boolean;
}

export default function WorkAreaInfo({ isInch }: Props): JSX.Element {
  const { boxgen: tBoxGen } = useI18n();

  // TODO: following logic is duplicated from BoxgenProvider, should be refactored with state management library
  const workarea = useWorkarea();
  const workareaInfo = useMemo(() => {
    const { width, height, displayHeight, label } = getWorkarea(workarea);

    if (workarea === 'ado1') {
      const laserModule = layerModuleHelper.getDefaultLaserModule();
      const boundary = moduleBoundary[laserModule];

      return {
        value: workarea,
        label: `${label} ${laserModule === LayerModule.LASER_10W_DIODE ? '10W' : '20W'}`,
        canvasWidth: width - boundary.left - boundary.right,
        canvasHeight: (displayHeight ?? height) - boundary.top - boundary.bottom,
      };
    }

    return {
      value: workarea,
      label,
      canvasWidth: width,
      canvasHeight: displayHeight ?? height,
    };
  }, [workarea]);

  const workareaLimit = Math.min(workareaInfo.canvasWidth, workareaInfo.canvasHeight);
  const { unitRatio, unit, decimal } = isInch
    ? { unit: 'in' as const, unitRatio: 25.4, decimal: 2 }
    : { unit: 'mm' as const, unitRatio: 1, decimal: 0 };
  // end of duplicated logic

  return (
    <div className={styles.workarea}>
      <Tooltip
        title={sprintf(
          tBoxGen.max_dimension_tooltip,
          `${(workareaLimit / unitRatio).toFixed(decimal)}${unit}`
        )}
        placement="bottomLeft"
        arrow={{ pointAtCenter: true }}
      >
        <QuestionCircleOutlined className={styles.icon} />
      </Tooltip>
      <span>
        {tBoxGen.workarea} : {workareaInfo.label}({' '}
        {(workareaInfo.canvasWidth / unitRatio).toFixed(decimal)} x{' '}
        {(workareaInfo.canvasHeight / unitRatio).toFixed(decimal)} {unit}
        <sup>2</sup> )
      </span>
    </div>
  );
}
