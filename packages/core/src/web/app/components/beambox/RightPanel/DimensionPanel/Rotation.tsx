import React, { memo, useEffect, useMemo, useRef } from 'react';

import classNames from 'classnames';

import { objectPanelInputTheme } from '@core/app/constants/antd-config';
import DimensionPanelIcons from '@core/app/icons/dimension-panel/DimensionPanelIcons';
import UnitInput from '@core/app/widgets/UnitInput';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import ObjectPanelItem from '../ObjectPanelItem';

import styles from './DimensionPanel.module.scss';

interface Props {
  onChange: (value: number, addToHistory?: boolean) => void;
  value: number;
}

const Rotation = ({ onChange, value }: Props): React.JSX.Element => {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectPanelEventEmitter = useMemo(() => eventEmitterFactory.createEventEmitter('object-panel'), []);
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
      <ObjectPanelItem.Number id="rotate" label={t.rotate} unit="degree" updateValue={onChange} value={value || 0} />
    );
  }

  return (
    <div className={styles.dimension}>
      <div className={classNames(styles.label, styles.img)}>
        <DimensionPanelIcons.Rotate />
      </div>
      <UnitInput
        className={styles.input}
        controls={false}
        fireOnChange
        id="rotate"
        onBlur={() => onChange(value, true)}
        onChange={onChange}
        onPressEnter={() => onChange(value, true)}
        precision={2}
        ref={inputRef}
        theme={objectPanelInputTheme}
        underline
        unit="deg"
        value={value || 0}
      />
    </div>
  );
};

export default memo(Rotation);
