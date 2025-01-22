import React, { memo } from 'react';

import { Col, Form, Row, Slider } from 'antd';

import useI18n from '@core/helpers/useI18n';

import styles from './EngraveDpiSliderV2.module.scss';

interface Props {
  onChange: (value: number) => void;
  value: number;
}

function EngraveDpiSliderV2({ onChange, value }: Props): React.JSX.Element {
  const lang = useI18n().beambox.document_panel;
  const onSliderValueChange = (val: number) => {
    onChange(val);
  };

  return (
    <Form.Item label={lang.engrave_dpi}>
      <Row gutter={[8, 0]}>
        <Col span={18}>
          <Slider defaultValue={value} max={1000} min={125} onAfterChange={onSliderValueChange} step={25} />
        </Col>
        <Col className={styles.value} span={6}>
          {value} DPI
        </Col>
      </Row>
    </Form.Item>
  );
}

export default memo(EngraveDpiSliderV2);
