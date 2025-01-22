import React from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Col, Form, InputNumber, Row, Slider } from 'antd';

import useI18n from '@core/helpers/useI18n';

import styles from './PanelContent.module.scss';

interface Props {
  setTolerance: (tolerance: number) => void;
  tolerance: number;
}

const MAX_TOLERANCE = 100;

export default function MagicWand({ setTolerance, tolerance }: Props): React.JSX.Element {
  const { image_edit_panel: lang } = useI18n();

  return (
    <div className={styles.wrapper}>
      <div className={styles['hint-text']}>
        <QuestionCircleOutlined className={styles.icon} />
        <span>{lang.magic_wand.description}</span>
      </div>
      <Form layout="vertical">
        <Form.Item label={`${lang.magic_wand.tolerance}:`}>
          <Row>
            <Col flex="auto">
              <Slider max={MAX_TOLERANCE} min={1} onChange={setTolerance} step={1} value={tolerance} />
            </Col>
            <Col flex="100px">
              <InputNumber max={MAX_TOLERANCE} min={1} onChange={setTolerance} step={1} value={tolerance} />
            </Col>
          </Row>
        </Form.Item>
      </Form>
    </div>
  );
}
