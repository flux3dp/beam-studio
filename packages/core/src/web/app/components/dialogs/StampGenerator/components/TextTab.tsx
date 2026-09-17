import React, { memo, useState } from 'react';

import { Collapse, ConfigProvider, Input, InputNumber, Switch } from 'antd';

import useI18n from '@core/helpers/useI18n';

import type { TextSlotDef } from '../types';
import useStampStore from '../useStampStore';

import FontSelect from './FontSelect';
import styles from './OptionsPanel.module.scss';

const TextSlotFields = ({ slot }: { slot: TextSlotDef }): null | React.JSX.Element => {
  const { generators: t } = useI18n();
  const values = useStampStore((s) => s.state?.texts[slot.id]);
  const updateText = useStampStore((s) => s.updateText);

  if (!values) return null;

  const patch = (p: Parameters<typeof updateText>[1]) => updateText(slot.id, p);
  const showLetterSpacing = !('bounds' in slot && (slot.fit ?? 'spacing') === 'spacing');
  const showFontSize = 'baseline' in slot || slot.fontSize !== undefined;

  return (
    <ConfigProvider theme={{ components: { Collapse: { contentPadding: '0', headerPadding: '0' } } }}>
      <div className={styles.rows}>
        <Input.TextArea
          autoSize={{ maxRows: 3, minRows: 1 }}
          onChange={(e) => patch({ text: e.target.value })}
          value={values.text}
        />
        <Collapse
          expandIconPosition="end"
          ghost
          items={[
            {
              children: (
                <>
                  <FontSelect font={values.font} onChange={(font) => patch({ font })} />
                  {showLetterSpacing && (
                    <div className={styles.row}>
                      <span>{t.text_options.letter_spacing}</span>
                      <InputNumber
                        onChange={(v) => patch({ letterSpacing: v ?? 0 })}
                        step={0.5}
                        value={values.letterSpacing}
                      />
                    </div>
                  )}
                  {showFontSize && (
                    <div className={styles.row}>
                      <span>{t.text_options.font_size}</span>
                      <InputNumber
                        min={1}
                        onChange={(v) => patch({ fontSize: v ?? slot.fontSize ?? 1 })}
                        value={values.fontSize}
                      />
                    </div>
                  )}
                </>
              ),
              classNames: { body: styles.fields },
              key: 'font',
              label: <span className={styles.label}>{t.text_options.font_settings}</span>,
            },
          ]}
        />
      </div>
    </ConfigProvider>
  );
};

const TextTab = (): null | React.JSX.Element => {
  const { stamp_generator: t } = useI18n();
  const template = useStampStore((s) => s.template);
  const texts = useStampStore((s) => s.state?.texts);
  const updateText = useStampStore((s) => s.updateText);
  const [activeKey, setActiveKey] = useState<string | undefined>(template?.texts[0]?.id);

  if (!template || !texts) return null;

  const items = template.texts.flatMap((slot) => {
    const { labelKey } = slot;

    if (!labelKey) return [];

    const enabled = texts[slot.id]?.enabled ?? false;
    const item = {
      children: <TextSlotFields slot={slot} />,
      collapsible: (enabled ? undefined : 'disabled') as 'disabled' | undefined,
      extra: (
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <Switch checked={enabled} onChange={(checked) => updateText(slot.id, { enabled: checked })} size="small" />
        </div>
      ),
      key: slot.id,
      label: t.slots[labelKey],
    };

    return [item];
  });

  return (
    <Collapse
      accordion
      activeKey={activeKey ? [activeKey] : []}
      items={items}
      onChange={(keys) => setActiveKey(Array.isArray(keys) ? keys[0] : keys)}
      size="small"
    />
  );
};

TextTab.displayName = 'TextTab';

export default memo(TextTab);
