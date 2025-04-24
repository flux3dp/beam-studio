import React, { memo } from 'react';

import type { ButtonProps, ThemeConfig } from 'antd';
import { Button, ConfigProvider } from 'antd';
import classNames from 'classnames';

import styles from './ThemedButton.module.scss';

type Theme = 'black' | 'white' | 'yellow';

interface Props extends ButtonProps {
  theme: Theme;
}

const themes: { [key in Theme]: ThemeConfig } = {
  black: {
    token: { colorPrimary: '#333333' },
  },
  white: {
    token: { colorPrimary: '#cecece', colorPrimaryHover: '#ffffff' },
  },
  yellow: {
    token: { colorPrimary: '#f8d464', colorPrimaryHover: '#ffc109', colorTextLightSolid: '#000' },
  },
};

const ThemedButton = ({ className, theme, ...props }: Props) => {
  return (
    <ConfigProvider theme={themes[theme]}>
      <Button className={classNames(className, styles[theme])} {...props} />
    </ConfigProvider>
  );
};

export default memo(ThemedButton);
