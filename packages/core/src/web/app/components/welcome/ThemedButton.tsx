import React, { memo } from 'react';

import type { ButtonProps, ThemeConfig } from 'antd';
import { Button, ConfigProvider } from 'antd';
import classNames from 'classnames';

import styles from './ThemedButton.module.scss';

type Theme = 'black' | 'white' | 'yellow';
interface Props extends Omit<ButtonProps, 'type'> {
  theme: Theme;
}

const themes: { [key in Theme]: ThemeConfig } = {
  black: {
    token: { colorPrimary: '#333333' },
  },
  white: {
    token: { colorPrimary: '#CECECE', colorPrimaryHover: '#FFFFFF' },
  },
  yellow: {
    token: { colorPrimary: '#F8D464', colorPrimaryHover: '#FFC109', colorTextLightSolid: '#000' },
  },
};

const ThemedButton = ({ className, theme, ...props }: Props) => {
  return (
    <ConfigProvider theme={themes[theme]}>
      <Button className={classNames(className, styles[theme])} {...props} type="primary" />
    </ConfigProvider>
  );
};

export default memo(ThemedButton);
