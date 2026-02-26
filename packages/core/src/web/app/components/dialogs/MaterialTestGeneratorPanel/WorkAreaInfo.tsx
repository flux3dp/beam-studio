import React, { useMemo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { sprintf } from 'sprintf-js';
import { match } from 'ts-pattern';

import { modelsWithModules } from '@core/app/actions/beambox/constant';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { getModuleBoundary } from '@core/app/constants/layer-module/module-boundary';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { getDefaultModule } from '@core/helpers/layer-module/layer-module-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './WorkAreaInfo.module.scss';

interface Props {
  isInch: boolean;
}

export default function WorkAreaInfo({ isInch }: Props): React.JSX.Element {
  const { boxgen: tBoxGen } = useI18n();

  // TODO: following logic is duplicated from BoxgenProvider, should be refactored with state management library
  const workarea = useWorkarea();
  const workareaInfo = useMemo(() => {
    const { displayHeight, height, label, width } = getWorkarea(workarea);

    if (modelsWithModules.has(workarea)) {
      const defaultModule = getDefaultModule();
      const labelSuffix = match(defaultModule)
        .with(LayerModule.LASER_10W_DIODE, () => ' 10W')
        .with(LayerModule.LASER_20W_DIODE, () => ' 20W')
        .otherwise(() => '');
      const boundary = getModuleBoundary(workarea, defaultModule);

      return {
        canvasHeight: (displayHeight ?? height) - boundary.top - boundary.bottom,
        canvasWidth: width - boundary.left - boundary.right,
        label: `${label}${labelSuffix}`,
        value: workarea,
      };
    }

    return {
      canvasHeight: displayHeight ?? height,
      canvasWidth: width,
      label,
      value: workarea,
    };
  }, [workarea]);

  const workareaLimit = Math.min(workareaInfo.canvasWidth, workareaInfo.canvasHeight);
  const { decimal, unit, unitRatio } = isInch
    ? { decimal: 2, unit: 'in' as const, unitRatio: 25.4 }
    : { decimal: 0, unit: 'mm' as const, unitRatio: 1 };
  // end of duplicated logic

  return (
    <div className={styles.workarea}>
      <Tooltip
        arrow={{ pointAtCenter: true }}
        placement="bottomLeft"
        title={sprintf(tBoxGen.max_dimension_tooltip, `${(workareaLimit / unitRatio).toFixed(decimal)}${unit}`)}
      >
        <QuestionCircleOutlined className={styles.icon} />
      </Tooltip>
      <span>
        {tBoxGen.workarea} : {workareaInfo.label}( {(workareaInfo.canvasWidth / unitRatio).toFixed(decimal)} x{' '}
        {(workareaInfo.canvasHeight / unitRatio).toFixed(decimal)} {unit}
        <sup>2</sup> )
      </span>
    </div>
  );
}
