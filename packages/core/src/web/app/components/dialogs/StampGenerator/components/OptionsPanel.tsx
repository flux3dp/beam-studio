import React, { memo, useState } from 'react';

import { Button, Switch, Tabs } from 'antd';

import Select from '@core/app/widgets/AntdSelect';
import useI18n from '@core/helpers/useI18n';

import { isLabeled } from '../types';
import useStampStore from '../useStampStore';

import BorderTab from './BorderTab';
import ElementTab from './ElementTab';
import styles from './OptionsPanel.module.scss';
import TextTab from './TextTab';

const BasicTab = (): null | React.JSX.Element => {
  const { generators: tGenerators, stamp_generator: t } = useI18n();
  const template = useStampStore((s) => s.template);
  const state = useStampStore((s) => s.state);
  const updateState = useStampStore((s) => s.updateState);
  const resetState = useStampStore((s) => s.resetState);

  if (!template || !state) return null;

  return (
    <div className={styles.rows}>
      <div className={styles.row}>
        <span>{t.basic.invert_color}</span>
        <Switch checked={state.invertColor} onChange={(invertColor) => updateState({ invertColor })} size="small" />
      </div>
      <div className={styles.row}>
        <span>{t.basic.flip_horizontal}</span>
        <Switch
          checked={state.flipHorizontal}
          onChange={(flipHorizontal) => updateState({ flipHorizontal })}
          size="small"
        />
      </div>
      {template.sizes.length > 1 && (
        <div className={styles.row}>
          <span>{tGenerators.general.size}</span>
          <Select
            onChange={(sizeIndex: number) => updateState({ sizeIndex })}
            options={template.sizes.map((s, i) => ({
              label: `${s.label ?? ''} ${s.widthMm / 10}cm`.trim(),
              value: i,
            }))}
            value={state.sizeIndex}
          />
        </div>
      )}
      <Button onClick={resetState} size="small">
        {tGenerators.general.reset_to_default}
      </Button>
    </div>
  );
};

const OptionsPanel = (): React.JSX.Element => {
  const { stamp_generator: t } = useI18n();
  const hasTexts = useStampStore((s) => s.template?.texts.some(isLabeled) ?? false);
  const hasElements = useStampStore((s) => s.template?.elements.some(isLabeled) ?? false);
  const hasBorder = useStampStore((s) => Boolean(s.template?.border));
  const [activeKey, setActiveKey] = useState('basic');
  const items = [
    { children: <BasicTab />, key: 'basic', label: t.tabs.basic },
    ...(hasTexts ? [{ children: <TextTab />, key: 'text', label: t.tabs.text }] : []),
    ...(hasElements ? [{ children: <ElementTab />, key: 'element', label: t.tabs.element }] : []),
    ...(hasBorder ? [{ children: <BorderTab />, key: 'border', label: t.tabs.border }] : []),
  ];

  return (
    <div className={styles.panel}>
      <Tabs
        // Fall back to Basic when a template switch removes the active tab
        activeKey={items.some((item) => item.key === activeKey) ? activeKey : 'basic'}
        items={items}
        onChange={setActiveKey}
        size="small"
      />
    </div>
  );
};

OptionsPanel.displayName = 'OptionsPanel';

export default memo(OptionsPanel);
