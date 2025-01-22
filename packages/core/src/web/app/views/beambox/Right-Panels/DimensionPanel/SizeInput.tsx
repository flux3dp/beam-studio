import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { objectPanelInputTheme } from '@core/app/constants/antd-config';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import UnitInput from '@core/app/widgets/UnitInput';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { useIsMobile } from '@core/helpers/system-helper';

import storage from '@app/implementations/storage';

import styles from './DimensionPanel.module.scss';
import { getValue } from './utils';

interface Props {
  onBlur?: () => void;
  onChange: (type: string, value: number) => void;
  type: 'h' | 'rx' | 'ry' | 'w';
  value: number;
}

const typeKeyMap = {
  h: 'height',
  rx: 'rx',
  ry: 'ry',
  w: 'width',
};

const SizeInput = ({ onBlur, onChange, type, value }: Props): React.JSX.Element => {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectPanelEventEmitter = useMemo(() => eventEmitterFactory.createEventEmitter('object-panel'), []);
  const isMobile = useIsMobile();
  const isInch = useMemo(() => storage.get('default-units') === 'inches', []);
  const unit = useMemo(() => (isInch ? 'in' : 'mm'), [isInch]);
  const precision = useMemo(() => (isInch ? 4 : 2), [isInch]);

  useEffect(() => {
    const handler = (newValues?: { [type: string]: number }) => {
      if (inputRef.current) {
        const newVal = getValue(newValues, type, { allowUndefined: true, unit });

        if (newVal === undefined) {
          return;
        }

        inputRef.current.value = newVal.toFixed(precision);
      }
    };

    objectPanelEventEmitter.on('UPDATE_DIMENSION_VALUES', handler);

    return () => {
      objectPanelEventEmitter.removeListener('UPDATE_DIMENSION_VALUES', handler);
    };
  }, [type, unit, precision, objectPanelEventEmitter]);

  const label = useMemo<JSX.Element | string>(() => {
    if (type === 'w') {
      return 'W';
    }

    if (type === 'h') {
      return 'H';
    }

    if (type === 'rx') {
      return 'W';
    }

    if (type === 'ry') {
      return 'H';
    }

    return null;
  }, [type]);
  const handleChange = useCallback(
    (val: number) => {
      const changeKey = typeKeyMap[type];
      const newVal = type === 'rx' || type === 'ry' ? val / 2 : val;

      onChange(changeKey, newVal);
    },
    [onChange, type],
  );

  if (isMobile) {
    return <ObjectPanelItem.Number id={`${type}_size`} label={label} updateValue={handleChange} value={value} />;
  }

  return (
    <div className={styles.dimension}>
      <div className={styles.label}>{label}</div>
      <UnitInput
        className={styles.input}
        controls={false}
        id={`${type}_size`}
        isInch={isInch}
        min={0}
        onBlur={onBlur}
        onChange={handleChange}
        precision={precision}
        ref={inputRef}
        step={isInch ? 2.54 : 1}
        theme={objectPanelInputTheme}
        underline
        unit={unit}
        value={value}
      />
    </div>
  );
};

export default memo(SizeInput);
