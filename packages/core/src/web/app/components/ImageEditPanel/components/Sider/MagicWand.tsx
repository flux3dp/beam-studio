import React from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Flex, Form, InputNumber, Slider } from 'antd';

import useI18n from '@core/helpers/useI18n';

import { useImageEditPanelStore } from '../../store';

import styles from './PanelContent.module.scss';

const MAX_TOLERANCE = 100;

export default function MagicWand(): React.JSX.Element {
  const { image_edit_panel: lang } = useI18n();
  const tolerance = useImageEditPanelStore((state) => state.tolerance);
  const setTolerance = useImageEditPanelStore((state) => state.setTolerance);

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>{lang.magic_wand.title}</div>
      <div className={styles['hint-text']}>
        <QuestionCircleOutlined className={styles.icon} />
        <span>{lang.magic_wand.description}</span>
      </div>
      <Form layout="vertical">
        <Form.Item label={`${lang.magic_wand.tolerance}:`}>
          <Flex align="center" gap={8} justify="between">
            <Slider
              className={styles.slider}
              max={MAX_TOLERANCE}
              min={1}
              onChange={setTolerance}
              step={1}
              value={tolerance}
            />
            <InputNumber
              max={MAX_TOLERANCE}
              min={1}
              onChange={(val) => {
                if (val !== null) setTolerance(val);
              }}
              step={1}
              value={tolerance}
            />
          </Flex>
        </Form.Item>
      </Form>
    </div>
  );
}
