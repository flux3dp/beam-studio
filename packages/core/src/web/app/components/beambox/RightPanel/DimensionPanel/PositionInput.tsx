import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { objectPanelInputTheme } from '@core/app/constants/antd-config';
import { useStorageStore } from '@core/app/stores/storageStore';
import UnitInput from '@core/app/widgets/UnitInput';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { useIsMobile } from '@core/helpers/system-helper';
import type { DimensionValues, PositionKey } from '@core/interfaces/ObjectPanel';

import ObjectPanelItem from '../ObjectPanelItem';

import styles from './DimensionPanel.module.scss';
import { getValue } from './utils';

interface Props {
  onChange: (type: PositionKey, value: number) => void;
  type: PositionKey;
  value: number;
}

const PositionInput = ({ onChange, type, value }: Props): React.JSX.Element => {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectPanelEventEmitter = useMemo(() => eventEmitterFactory.createEventEmitter('object-panel'), []);
  const isMobile = useIsMobile();
  const isInch = useStorageStore((state) => state.isInch);
  const { precision, unit } = useMemo<{ precision: number; unit: 'in' | 'mm' }>(
    () => (isInch ? { precision: 4, unit: 'in' } : { precision: 2, unit: 'mm' }),
    [isInch],
  );

  useEffect(() => {
    const handler = (newValues: DimensionValues) => {
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

  const label = useMemo<React.ReactNode>(() => {
    if (type === 'x') {
      return 'X';
    }

    if (type === 'y') {
      return 'Y';
    }

    if (type === 'x1') {
      return (
        <>
          X<sub>1</sub>
        </>
      );
    }

    if (type === 'y1') {
      return (
        <>
          Y<sub>1</sub>
        </>
      );
    }

    if (type === 'x2') {
      return (
        <>
          X<sub>2</sub>
        </>
      );
    }

    if (type === 'y2') {
      return (
        <>
          Y<sub>2</sub>
        </>
      );
    }

    if (type === 'cx') {
      return (
        <>
          X<sub>C</sub>
        </>
      );
    }

    if (type === 'cy') {
      return (
        <>
          Y<sub>C</sub>
        </>
      );
    }

    return null;
  }, [type]);
  const inputId = useMemo(() => `${type}_position`, [type]);
  const handleChange = useCallback(
    (val: null | number) => {
      if (val !== null) onChange(type, val);
    },
    [type, onChange],
  );

  if (isMobile) {
    return <ObjectPanelItem.Number id={inputId} label={label} updateValue={handleChange} value={value} />;
  }

  return (
    <div className={styles.dimension}>
      <div className={styles.label}>{label}</div>
      <UnitInput
        className={styles.input}
        controls={false}
        id={inputId}
        isInch={isInch}
        onChange={handleChange}
        precision={isInch ? 4 : 2}
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

export default memo(PositionInput);
