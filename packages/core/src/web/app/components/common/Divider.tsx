import React from 'react';

import type { DividerProps } from 'antd';
import { Divider as AntdDivider } from 'antd';

interface MarginProps {
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
}

/** Antd Divider with default no margins */
export const Divider = ({
  marginBottom = 0,
  marginLeft = 0,
  marginRight = 0,
  marginTop = 0,
  style,
  ...props
}: DividerProps & MarginProps): React.JSX.Element => {
  return (
    <AntdDivider
      style={{
        height: props.type === 'vertical' ? '100%' : undefined,
        marginBottom,
        marginLeft,
        marginRight,
        marginTop,
        ...style,
      }}
      {...props}
    />
  );
};

export default Divider;
