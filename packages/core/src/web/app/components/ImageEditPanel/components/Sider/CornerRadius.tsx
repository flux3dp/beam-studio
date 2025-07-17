import React, { memo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Flex, Form, InputNumber, Slider } from 'antd';

import useI18n from '@core/helpers/useI18n';

import { useImageEditPanelStore } from '../../store';

import styles from './PanelContent.module.scss';

const CornerRadius = (): React.JSX.Element => {
  const { image_edit_panel: lang } = useI18n();
  const cornerRadius = useImageEditPanelStore((state) => state.cornerRadius);
  const setCornerRadius = useImageEditPanelStore((state) => state.setCornerRadius);

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>{lang.rounded_corner.title}</div>
      <div className={styles['hint-text']}>
        <QuestionCircleOutlined className={styles.icon} />
        <span>{lang.rounded_corner.description}</span>
      </div>
      <Form layout="vertical">
        <Form.Item label={lang.rounded_corner.radius}>
          <Flex align="center" gap={8} justify="between">
            <Slider
              className={styles.slider}
              max={100}
              min={0}
              onChange={(val) => setCornerRadius(val, false)}
              onChangeComplete={(val) => setCornerRadius(val, true)}
              step={1}
              value={cornerRadius}
            />
            <InputNumber
              max={100}
              min={0}
              onBlur={() => setCornerRadius(cornerRadius, true)}
              onChange={(val) => {
                if (val !== null) setCornerRadius(val, false);
              }}
              onPressEnter={() => setCornerRadius(cornerRadius, true)}
              step={1}
              value={cornerRadius}
            />
          </Flex>
        </Form.Item>
      </Form>
    </div>
  );
};

export default memo(CornerRadius);
