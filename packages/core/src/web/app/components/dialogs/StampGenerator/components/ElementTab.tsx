import React, { memo } from 'react';

import { InputNumber } from 'antd';

import ElementPicker from '@core/app/widgets/ElementPicker';
import useI18n from '@core/helpers/useI18n';

import { isLabeled } from '../types';
import useStampStore from '../useStampStore';

import styles from './OptionsPanel.module.scss';

/** Per labeled element slot: the shared preset picker (+ Element panel browser) and a size row. Clearing the slot disables it. */
const ElementTab = (): null | React.JSX.Element => {
  const { generators: tGen, stamp_generator: t } = useI18n();
  const template = useStampStore((s) => s.template);
  const elements = useStampStore((s) => s.state?.elements);
  const updateElement = useStampStore((s) => s.updateElement);

  if (!template || !elements) return null;

  return (
    <div className={styles.rows}>
      {template.elements.map((slot) => {
        const values = elements[slot.id];

        if (!isLabeled(slot) || !values) return null;

        return (
          <React.Fragment key={slot.id}>
            <span>{t.slots[slot.labelKey!]}</span>
            <ElementPicker
              onChange={(shapeKey) => updateElement(slot.id, { enabled: true, shapeKey })}
              onClear={values.enabled ? () => updateElement(slot.id, { enabled: false, shapeKey: '' }) : undefined}
              options={slot.options ?? []}
              selectedKey={values.enabled ? values.shapeKey : ''}
            />
            <div className={styles.row}>
              <span>{tGen.general.size}</span>
              <InputNumber
                disabled={!values.enabled}
                formatter={(v) => `${v ?? ''}%`}
                max={400}
                min={10}
                onChange={(v) => updateElement(slot.id, { scale: v ?? 100 })}
                parser={(v) => Number(v?.replace('%', '') ?? 100)}
                step={10}
                value={values.scale}
              />
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default memo(ElementTab);
