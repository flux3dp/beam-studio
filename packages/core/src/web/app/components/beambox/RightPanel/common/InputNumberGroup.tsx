import React from 'react';

import { Button } from 'antd';

import Row from '@core/app/components/beambox/RightPanel/common/Row';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import type { UnitInputProps } from '@core/app/widgets/UnitInput';
import UnitInput from '@core/app/widgets/UnitInput';
import type { NumberOptionConfig } from '@core/interfaces/ObjectPanel';

const clipValue = (val: number, min?: number, max?: number) => {
  if (min !== undefined && val < min) return min;

  if (max !== undefined && val > max) return max;

  return val;
};

type Props = UnitInputProps & {
  buttonIconMinus?: React.ReactNode;
  buttonIconPlus?: React.ReactNode;
  buttonStep?: number;
  config: NumberOptionConfig;
  isInch?: boolean;
  onChange: (val: number, addToHistory?: boolean) => void;
  value: number;
};

const InputNumberGroup = ({
  buttonIconMinus = <ObjectPanelIcons.Minus viewBox="6 6 20 20" />,
  buttonIconPlus = <ObjectPanelIcons.Plus viewBox="6 6 20 20" />,
  buttonStep: propsButtonStep,
  config,
  isInch,
  onChange,
  value,
  ...props
}: Props): React.JSX.Element => {
  const { id, max, min, precision, step } = config;
  const buttonStep = propsButtonStep ?? step ?? 1;

  return (
    <Row>
      <Button
        disabled={min !== undefined && value <= min}
        icon={buttonIconMinus}
        onClick={() => onChange(clipValue(value - buttonStep, min, max))}
      />
      <UnitInput
        controls={false}
        id={id}
        isInch={isInch}
        max={max}
        min={min}
        onChange={(e) => e && onChange(e)}
        precision={precision}
        step={step}
        value={value}
        {...props}
      />
      <Button
        disabled={max !== undefined && value >= max}
        icon={buttonIconPlus}
        onClick={() => onChange(clipValue(value + buttonStep, min, max))}
      />
    </Row>
  );
};

export default InputNumberGroup;
