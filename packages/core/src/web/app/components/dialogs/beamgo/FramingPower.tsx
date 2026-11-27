import React from 'react';

import { Alert, Flex, InputNumber } from 'antd';

import useI18n from '@core/helpers/useI18n';

interface Props {
  disabled?: boolean;
  onChange: (value: number) => void;
  value: number;
}

const FramingPower = ({ disabled, onChange, value }: Props): React.JSX.Element => {
  const { beamgo: t } = useI18n();

  return (
    <Flex gap={8} vertical>
      <Alert message={t.framing_warning} showIcon type="warning" />
      <Flex align="center" gap={8}>
        <label htmlFor="beamgo-framing-power">{t.framing_power}</label>
        <InputNumber
          addonAfter="%"
          disabled={disabled}
          id="beamgo-framing-power"
          max={100}
          min={1}
          onChange={(next) => {
            if (next !== null && Number.isInteger(next) && next >= 1 && next <= 100) onChange(next);
          }}
          precision={0}
          value={value}
        />
      </Flex>
    </Flex>
  );
};

export default FramingPower;
