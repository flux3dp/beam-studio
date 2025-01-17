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
  type: 'x' | 'y' | 'x1' | 'y1' | 'x2' | 'y2' | 'cx' | 'cy';
  value: number;
  onChange: (type: string, value: number) => void;
}

const PositionInput = ({ type, value, onChange }: Props): JSX.Element => {
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
    if (type === 'x') return 'X';
    if (type === 'y') return 'Y';
    if (type === 'x1')
      return (
        <>
          X<sub>1</sub>
        </>
      );
    if (type === 'y1')
      return (
        <>
          Y<sub>1</sub>
        </>
      );
    if (type === 'x2')
      return (
        <>
          X<sub>2</sub>
        </>
      );
    if (type === 'y2')
      return (
        <>
          Y<sub>2</sub>
        </>
      );
    if (type === 'cx')
      return (
        <>
          X<sub>C</sub>
        </>
      );
    if (type === 'cy')
      return (
        <>
          Y<sub>C</sub>
        </>
      );
    return null;
  }, [type]);
  const inputId = useMemo(() => `${type}_position`, [type]);
  const handleChange = useCallback((val: number) => onChange(type, val), [type, onChange]);
  if (isMobile)
    return (
      <ObjectPanelItem.Number id={inputId} value={value} updateValue={handleChange} label={label} />
    );
  return (
    <div className={styles.dimension}>
      <div className={styles.label}>{label}</div>
      <UnitInput
          ref={inputRef}
          id={inputId}
          className={styles.input}
          theme={objectPanelInputTheme}
          underline
          unit={unit}
          isInch={isInch}
          precision={isInch ? 4 : 2}
          step={isInch ? 2.54 : 1}
          value={value}
          controls={false}
          onChange={handleChange}
        />
    </div>
  );
};

export default memo(PositionInput);
