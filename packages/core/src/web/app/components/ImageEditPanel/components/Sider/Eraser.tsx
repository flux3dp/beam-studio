import React from 'react';

import { Col, Form, InputNumber, Row, Slider } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

import useI18n from 'helpers/useI18n';

import styles from './PanelContent.module.scss';

interface Props {
  brushSize: number;
  setBrushSize: (size: number) => void;
}

const MAX_BRUSH_SIZE = 128;

export default function Eraser({ brushSize, setBrushSize }: Props): JSX.Element {
  const { image_edit_panel: lang } = useI18n();

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
              <Slider
                min={1}
                max={MAX_BRUSH_SIZE}
                step={1}
                value={brushSize}
                onChange={setBrushSize}
              />
            </Col>
            <Col flex="100px">
              <InputNumber
                min={1}
                max={MAX_BRUSH_SIZE}
                step={1}
                value={brushSize}
                onChange={setBrushSize}
              />
            </Col>
          </Row>
        </Form.Item>
      </Form>
    </div>
  );
}
