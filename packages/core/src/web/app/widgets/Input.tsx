import React, { forwardRef, useEffect } from 'react';

import type { InputProps, InputRef } from 'antd';
import { Input as AntdInput } from 'antd';

import communicator from '@app/implementations/communicator';

const setEditingInput = (): void => communicator.send('SET_EDITING_STANDARD_INPUT', true);
const setStopEditingInput = (): void => communicator.send('SET_EDITING_STANDARD_INPUT', false);

/**
 * Basically Antd Input Wrapper
 * with onFocus and onBlur to setEditingInput and setStopEditingInput in order to disable electron shortcuts
 */
const Input = forwardRef<InputRef, InputProps>(({ onBlur, onFocus, ...props }, ref): React.JSX.Element => {
  useEffect(() => () => setStopEditingInput(), []);

  return (
    <AntdInput
      {...props}
      onBlur={(e) => {
        setStopEditingInput();
        onBlur?.(e);
      }}
      onFocus={(e) => {
        setEditingInput();
        onFocus?.(e);
      }}
      ref={ref}
    />
  );
});

export default Input;
