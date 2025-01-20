import React, { forwardRef } from 'react';

interface Props {
  addonAfter?: string;
  className?: string;
  'data-testid'?: string;
  disabled?: boolean;
  fireOnChange?: boolean;
  id: string;
  isInch?: boolean;
  max?: number;
  min?: number;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onChange?: (value: number) => void;
  precision?: number;
  underline?: boolean;
  unit?: string;
  value?: number;
}

const mockComponent = forwardRef<HTMLInputElement, Props>(
  (
    {
      addonAfter,
      className,
      'data-testid': testId,
      disabled,
      fireOnChange,
      id,
      isInch,
      max,
      min,
      onBlur,
      onChange,
      precision,
      underline,
      unit,
      value,
    }: Props,
    outerRef,
  ): React.JSX.Element => (
    <div className={className}>
      UnitInput: {id}
      {addonAfter && <p>addonAfter: {addonAfter}</p>}
      {isInch && <p>isInch</p>}
      {precision && <p>precision: {precision}</p>}
      {underline && <p>underline</p>}
      {unit && <p>unit: {unit}</p>}
      {fireOnChange && <p>fireOnChange</p>}
      <input
        data-testid={testId}
        disabled={disabled}
        id={id}
        max={max}
        min={min}
        onBlur={onBlur}
        onChange={(e) => onChange(Number(e.target.value))}
        ref={outerRef}
        value={value}
      />
    </div>
  ),
);

export default mockComponent;
