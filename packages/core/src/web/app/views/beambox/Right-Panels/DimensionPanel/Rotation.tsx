import classNames from 'classnames';
import React, { memo, useEffect, useMemo, useRef } from 'react';

import DimensionPanelIcons from '@core/app/icons/dimension-panel/DimensionPanelIcons';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';
import { objectPanelInputTheme } from '@core/app/constants/antd-config';
import { useIsMobile } from '@core/helpers/system-helper';

import styles from './DimensionPanel.module.scss';

interface Props {
  value: number;
  onChange: (value: number, addToHistory?: boolean) => void;
}

const Rotation = ({ value, onChange }: Props): JSX.Element => {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectPanelEventEmitter = useMemo(
    () => eventEmitterFactory.createEventEmitter('object-panel'),
    [],
  );
  const isMobile = useIsMobile();
  const t = useI18n().topbar.menu;
  useEffect(() => {
    const handler = (newValues?: { rotation?: number }) => {
      if (newValues?.rotation !== undefined && inputRef.current) {
        inputRef.current.value = newValues.rotation.toFixed(2);
      }
    };
    objectPanelEventEmitter.on('UPDATE_DIMENSION_VALUES', handler);
    return () => {
      objectPanelEventEmitter.removeListener('UPDATE_DIMENSION_VALUES', handler);
    };
  }, [objectPanelEventEmitter]);

  if (isMobile) {
    return (
      <ObjectPanelItem.Number
        id="rotate"
        value={value || 0}
        updateValue={onChange}
        label={t.rotate}
        unit="degree"
      />
    );
  }

  return (
    <div className={styles.dimension}>
      <div className={classNames(styles.label, styles.img)}>
        <DimensionPanelIcons.Rotate />
      </div>
      <UnitInput
        ref={inputRef}
        id="rotate"
        className={styles.input}
        theme={objectPanelInputTheme}
        underline
        controls={false}
        unit="deg"
        value={value || 0}
        precision={2}
        onChange={onChange}
        fireOnChange
        onBlur={() => onChange(value, true)}
        onPressEnter={() => onChange(value, true)}
      />
    </div>
  );
};

export default memo(Rotation);
