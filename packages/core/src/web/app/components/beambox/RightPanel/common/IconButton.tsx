import React from 'react';

import type { ButtonProps } from 'antd';
import { Button } from 'antd';

type Props = Pick<ButtonProps, 'className' | 'color' | 'disabled' | 'icon' | 'id' | 'onClick' | 'title'>;

const IconButton = ({ color = 'default', ...props }: Props) => {
  return <Button color={color} variant="text" {...props} />;
};

export default IconButton;
