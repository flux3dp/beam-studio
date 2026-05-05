import type { ReactNode } from 'react';
import React, { useCallback, useEffect, useState } from 'react';

import { Collapse, ConfigProvider, Switch } from 'antd';

import { CONTROL_COLLAPSE_TOKEN } from '../../../constants/designTokens';
import useKeychainShapeStore from '../../../useKeychainShapeStore';

import styles from './AccordionGroup.module.scss';

interface AccordionGroupProps<D extends { id: string }> {
  labelPrefix: string;
  optionDefs: D[];
  renderControl: (def: D) => ReactNode;
  stateKey: 'holes' | 'texts';
}

const AccordionGroup = <D extends { id: string }>({
  labelPrefix,
  optionDefs,
  renderControl,
  stateKey,
}: AccordionGroupProps<D>): ReactNode => {
  const record = useKeychainShapeStore((s) => s.state[stateKey]);

  const firstEnabledKey = optionDefs.find((def) => record[def.id]?.enabled)?.id;
  const [activeKey, setActiveKey] = useState<string | undefined>(firstEnabledKey);

  useEffect(() => {
    if (activeKey && !record[activeKey]?.enabled) {
      setActiveKey(undefined);
    }
  }, [activeKey, record]);

  const handleToggle = useCallback(
    (id: string, enabled: boolean) => {
      const { applyOptions, state, updateState } = useKeychainShapeStore.getState();

      updateState({ [stateKey]: { ...state[stateKey], [id]: { ...state[stateKey][id], enabled } } });
      applyOptions();
    },
    [stateKey],
  );

  const items = optionDefs.map((def) => {
    const enabled = record[def.id]?.enabled ?? false;

    return {
      children: renderControl(def),
      classNames: { body: styles.body, extra: styles.extra },
      collapsible: (enabled ? undefined : 'disabled') as 'disabled' | undefined,
      extra: (
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <Switch checked={enabled} onChange={(checked) => handleToggle(def.id, checked)} size="small" />
        </div>
      ),
      key: def.id,
      label: `${labelPrefix} - ${def.id}`,
    };
  });

  return (
    <ConfigProvider
      theme={{
        components: {
          Collapse: CONTROL_COLLAPSE_TOKEN,
        },
      }}
    >
      <Collapse
        accordion
        activeKey={activeKey ? [activeKey] : []}
        className={styles.accordion}
        items={items}
        onChange={(keys) => {
          const key = Array.isArray(keys) ? keys[0] : keys;

          setActiveKey(key);
        }}
      />
    </ConfigProvider>
  );
};

AccordionGroup.displayName = 'AccordionGroup';

export default AccordionGroup;
