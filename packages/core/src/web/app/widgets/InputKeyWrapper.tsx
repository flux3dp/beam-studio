import * as React from 'react';

import type { InputRef } from 'antd';

interface Props {
  children: React.ReactNode;
  inputRef: React.MutableRefObject<InputRef>;
}

const InputKeyWrapper = (props: Props): React.JSX.Element => {
  const { children, inputRef } = props;

  const keyFilter = (e: React.KeyboardEvent): void => {
    if (e.metaKey && ['a', 'c', 'v', 'x', 'z'].includes(e.key)) {
      if (e.key === 'a') {
        inputRef.current?.focus({
          cursor: 'all',
        });
        e.stopPropagation();
      }
    } else if (e.key !== 'Escape') {
      e.stopPropagation();
    }
  };

  return <div onKeyDown={keyFilter}>{children}</div>;
};

export default InputKeyWrapper;
