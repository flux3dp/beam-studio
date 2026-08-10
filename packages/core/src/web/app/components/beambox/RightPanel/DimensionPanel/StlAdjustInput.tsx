import React, { useState } from 'react';

import { InputNumber } from 'antd';

interface Props {
  className?: string;
  id: string;
  /** Called with the typed number on Enter. The field clears itself afterwards. */
  onCommit: (value: number) => void;
  placeholder: string;
  precision?: number;
  title: string;
}

/**
 * The "adjust from the current value" field next to a dimension input.
 *
 * Separate from the value input because it is not a value: typing 90 here means "90 more than
 * whatever it is now", so it must not show the current state and must clear once applied.
 * Committing on Enter rather than on blur is deliberate — a stray click away should not move the
 * object, and it makes repeated nudges (Enter, Enter, Enter) work.
 *
 * A plain `InputNumber` rather than `UnitInput`: the field is empty most of the time, and any unit
 * conversion belongs to the caller, which knows whether it is holding a length, an angle or a
 * percentage.
 */
const StlAdjustInput = ({ className, id, onCommit, placeholder, precision, title }: Props): React.JSX.Element => {
  const [value, setValue] = useState<null | number>(null);

  return (
    <InputNumber
      className={className}
      controls={false}
      id={id}
      onChange={setValue}
      onPressEnter={() => {
        if (typeof value !== 'number' || Number.isNaN(value)) return;

        onCommit(value);
        setValue(null);
      }}
      placeholder={placeholder}
      precision={precision}
      size="small"
      title={title}
      value={value}
    />
  );
};

export default StlAdjustInput;
