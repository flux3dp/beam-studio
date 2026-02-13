import React from 'react';

import type { ThemeConfig } from 'antd';
import { ConfigProvider } from 'antd';
import classNames from 'classnames';

import type { UnitInputProps } from '@core/app/widgets/UnitInput';
import UnitInput from '@core/app/widgets/UnitInput';

import styles from './OptionsInput.module.scss';

interface OptionsInputProps extends UnitInputProps {
  height?: number;
  width?: number;
}

const OptionsInput = (props: OptionsInputProps): React.ReactNode => {
  const { className: propClassName, height = 25, theme: propTheme, width = 40, ...inputProps } = props;
  const theme: ThemeConfig = {
    components: {
      InputNumber: {
        activeShadow: 'none',
        controlWidth: width,
      },
    },
    token: {
      colorBgContainer: 'transparent',
      colorBgContainerDisabled: 'transparent',
      controlPaddingHorizontal: 6,
      fontSize: 12,
      lineWidth: 0,
    },
    ...propTheme,
  };

  return (
    <ConfigProvider theme={theme}>
      <UnitInput
        className={classNames(styles.input, propClassName)}
        controls={false}
        style={{ '--height': `${height}px` } as React.CSSProperties}
        underline
        {...inputProps}
      />
    </ConfigProvider>
  );
};

export default OptionsInput;
