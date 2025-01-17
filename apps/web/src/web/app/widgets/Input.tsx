import React, { forwardRef, useEffect } from 'react';
import { Input as AntdInput, InputProps, InputRef } from 'antd';

import communicator from 'implementations/communicator';

const setEditingInput = (): void => communicator.send('SET_EDITING_STANDARD_INPUT', true);
const setStopEditingInput = (): void => communicator.send('SET_EDITING_STANDARD_INPUT', false);

/**
 * Basically Antd Input Wrapper
 * with onFocus and onBlur to setEditingInput and setStopEditingInput in order to disable electron shortcuts
 */
const Input = forwardRef<InputRef, InputProps>(
  ({ onFocus, onBlur, ...props }, ref): JSX.Element => {
    useEffect(() => () => setStopEditingInput(), []);
    return (
      <AntdInput
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
        ref={ref}
        onFocus={(e) => {
          setEditingInput();
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setStopEditingInput();
          onBlur?.(e);
        }}
      />
    );
  }
);

export default Input;
