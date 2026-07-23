import React from 'react';

import ControlBlock from '@core/app/components/beambox/RightPanel/common/ControlBlock';
import InputNumberGroup from '@core/app/components/beambox/RightPanel/common/InputNumberGroup';
import Slider from '@core/app/components/beambox/RightPanel/common/Slider';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import { ControlType } from '@core/helpers/element/editable/base';
import useI18n from '@core/helpers/useI18n';

import OptionsInput from '../../OptionsInput';

import styles from './StartOffsetBlock.module.scss';

interface Props {
  hasMultiValue?: boolean;
  onValueChange: (val: null | number) => void;
  value: number;
}

const config = {
  max: 100,
  min: 0,
  precision: 0,
};

export default function StartOffsetBlock({ hasMultiValue, onValueChange, value }: Props): React.JSX.Element {
  const LANG = useI18n().beambox.right_panel.object_panel.option_panel;
  const isTablet = useIsTabletOrMobile();

  return isTablet ? (
    <ControlBlock label={LANG.start_offset} type={ControlType.TEXTPATH_OFFSET}>
      <Slider config={config} onChange={onValueChange} value={value} />
      <InputNumberGroup config={config} onChange={onValueChange} value={value} />
    </ControlBlock>
  ) : (
    <ControlBlock type={ControlType.TEXTPATH_OFFSET}>
      <div className={styles.container}>
        <div className={styles.label}>{LANG.start_offset}</div>
        <OptionsInput
          displayMultiValue={hasMultiValue}
          height={20}
          max={100}
          min={0}
          onChange={onValueChange}
          precision={0}
          value={value}
        />
      </div>
    </ControlBlock>
  );
}
