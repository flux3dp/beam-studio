import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import classNames from 'classnames';

import { objectPanelInputTheme } from '@core/app/constants/antd-config';
import DimensionPanelIcons from '@core/app/icons/dimension-panel/DimensionPanelIcons';
import { useIsMobile } from '@core/app/stores/screenStore';
import UnitInput from '@core/app/widgets/UnitInput';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
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
  const previewRef = useRef<{ isPreviewing: boolean; original: number }>({ isPreviewing: false, original: value });

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

  const onPreview = useCallback(
    (val: null | number) => {
      if (val === null) return;

      if (!previewRef.current.isPreviewing) {
        previewRef.current = { isPreviewing: true, original: value };
      }

      onChange(val, false);
    },
    [onChange, value],
  );
  const onChangeComplete = useCallback(
    (val: null | number) => {
      if (val === null) return;

      if (previewRef.current.isPreviewing) {
        onChange(previewRef.current.original, false);
        previewRef.current.isPreviewing = false;
      }

      onChange(val, true);
    },
    [onChange],
  );

  if (isMobile) {
    return (
      <ObjectPanelItem.Number
        id="rotate"
        label={t.rotate}
        unit="degree"
        updateValue={onChangeComplete}
        value={value || 0}
      />
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
        onBlur={() => onChangeComplete(value)}
        onChange={onPreview}
        onPressEnter={() => onChangeComplete(value)}
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
