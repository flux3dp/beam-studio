import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import eventEmitterFactory from 'helpers/eventEmitterFactory';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import storage from 'implementations/storage';
import UnitInput from 'app/widgets/UnitInput';
import { objectPanelInputTheme } from 'app/constants/antd-config';
import { useIsMobile } from 'helpers/system-helper';

import styles from './DimensionPanel.module.scss';
import { getValue } from './utils';

interface Props {
  type: 'w' | 'h' | 'rx' | 'ry';
  value: number;
  onChange: (type: string, value: number) => void;
  onBlur?: () => void;
}

const typeKeyMap = {
  w: 'width',
  h: 'height',
  rx: 'rx',
  ry: 'ry',
};

const SizeInput = ({ type, value, onChange, onBlur }: Props): JSX.Element => {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectPanelEventEmitter = useMemo(() => eventEmitterFactory.createEventEmitter('object-panel'), []);
  const isMobile = useIsMobile();
  const isInch = useMemo(() => storage.get('default-units') === 'inches', []);
  const unit = useMemo(() => (isInch ? 'in' : 'mm'), [isInch]);
  const precision = useMemo(() => (isInch ? 4 : 2), [isInch]);

  useEffect(() => {
    const handler = (newValues?: { [type: string]: number }) => {
      if (inputRef.current) {
        const newVal = getValue(newValues, type, { unit, allowUndefined: true });
        if (newVal === undefined) return;
        inputRef.current.value = newVal.toFixed(precision);
      }
    }
    objectPanelEventEmitter.on('UPDATE_DIMENSION_VALUES', handler);
    return () => {
      objectPanelEventEmitter.removeListener('UPDATE_DIMENSION_VALUES', handler);
    }
  }, [type, unit, precision, objectPanelEventEmitter]);

  const label = useMemo<string | JSX.Element>(() => {
    if (type === 'w') return 'W';
    if (type === 'h') return 'H';
    if (type === 'rx') return 'W';
    if (type === 'ry') return 'H';
    return null;
  }, [type]);
  const handleChange = useCallback(
    (val: number) => {
      const changeKey = typeKeyMap[type];
      const newVal = type === 'rx' || type === 'ry' ? val / 2 : val;
      onChange(changeKey, newVal);
    },
    [onChange, type]
  );

  if (isMobile) {
    return (
      <ObjectPanelItem.Number
        id={`${type}_size`}
        value={value}
        updateValue={handleChange}
        label={label}
      />
    );
  }

  return (
    <div className={styles.dimension}>
      <div className={styles.label}>{label}</div>
        <UnitInput
          ref={inputRef}
          id={`${type}_size`}
          className={styles.input}
          theme={objectPanelInputTheme}
          underline
          unit={unit}
          isInch={isInch}
          precision={precision}
          step={isInch ? 2.54 : 1}
          value={value}
          onBlur={onBlur}
          controls={false}
          onChange={handleChange}
          min={0}
        />
    </div>
  );
};

export default memo(SizeInput);
