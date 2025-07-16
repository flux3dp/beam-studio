import React from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Col, Form, InputNumber, Row, Slider } from 'antd';

import useI18n from '@core/helpers/useI18n';

import { useImageEditPanelStore } from '../../store';

import styles from './PanelContent.module.scss';

const MAX_BRUSH_SIZE = 128;

export default function Eraser(): React.JSX.Element {
  const { image_edit_panel: lang } = useI18n();
  const { brushSize, setBrushSize } = useImageEditPanelStore();

  return (
    <div className={styles.wrapper}>
      <div className={styles['hint-text']}>
        <QuestionCircleOutlined className={styles.icon} />
        <span>{lang.eraser.description}</span>
      </div>
      <Form layout="vertical">
        <Form.Item label={`${lang.eraser.brush_size}:`}>
          <Row>
            <Col flex="auto">
              <Slider max={MAX_BRUSH_SIZE} min={1} onChange={setBrushSize} step={1} value={brushSize} />
            </Col>
            <Col flex="100px">
              <InputNumber
                max={MAX_BRUSH_SIZE}
                min={1}
                onChange={(val) => {
                  if (val !== null) setBrushSize(val);
                }}
                step={1}
                value={brushSize}
              />
            </Col>
          </Row>
        </Form.Item>
      </Form>
    </div>
  );
}
