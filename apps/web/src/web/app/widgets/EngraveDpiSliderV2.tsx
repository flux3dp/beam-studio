import React, { memo } from 'react';
import { Col, Form, Row, Slider } from 'antd';

import useI18n from 'helpers/useI18n';

import styles from './EngraveDpiSliderV2.module.scss';

interface Props {
  value: number;
  onChange: (value: number) => void;
}

function EngraveDpiSliderV2({ value, onChange }: Props): JSX.Element {
  const lang = useI18n().beambox.document_panel;
  const onSliderValueChange = (val: number) => {
    onChange(val);
  };

  return (
    <Form.Item label={lang.engrave_dpi}>
      <Row gutter={[8, 0]}>
        <Col span={18}>
          <Slider
            min={125}
            max={1000}
            step={25}
            defaultValue={value}
            onAfterChange={onSliderValueChange}
          />
        </Col>
        <Col span={6} className={styles.value}>
          {value} DPI
        </Col>
      </Row>
    </Form.Item>
  );
}

export default memo(EngraveDpiSliderV2);
