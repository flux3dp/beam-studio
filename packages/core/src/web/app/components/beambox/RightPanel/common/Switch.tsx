import React from 'react';

import type { SwitchProps } from 'antd';
import { Switch as AntdSwitch } from 'antd';
import classNames from 'classnames';

import styles from './Switch.module.scss';

interface Props extends SwitchProps {
  partial?: boolean;
}

// Common style (size: small) for switch in object panel
// Also handle partial state by opacity
const Switch = ({ className, partial, ...props }: Props) => {
  return <AntdSwitch className={classNames({ [styles.partial]: partial }, className)} size="small" {...props} />;
};

export default Switch;
