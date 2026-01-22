import React from 'react';

import { Button } from 'antd';
import type { ButtonProps } from 'antd';

import type { OneOf } from '@core/interfaces/utils';

import styles from './SettingButton.module.scss';
import SettingFormItem from './SettingFormItem';

type CommonProps = {
  buttonText: string;
  buttonType?: ButtonProps['type'];
  danger?: boolean;
  id: string;
  onClick: () => void;
};

type WithLabelProps = {
  label: string;
  tooltip?: string;
  url?: string;
};

type StandaloneProps = {
  standalone: true;
};

type Props = CommonProps & OneOf<WithLabelProps, StandaloneProps>;

const SettingButton = ({
  buttonText,
  buttonType = 'default',
  danger = false,
  id,
  label,
  onClick,
  standalone,
  tooltip,
  url,
}: Props): React.JSX.Element => {
  const button = (
    <Button
      className={standalone ? styles['standalone-button'] : undefined}
      danger={danger}
      id={id}
      onClick={onClick}
      type={buttonType}
    >
      {buttonText}
    </Button>
  );

  if (standalone) {
    return button;
  }

  return (
    <SettingFormItem id={`${id}-label`} label={label ?? ''} tooltip={tooltip} url={url}>
      {button}
    </SettingFormItem>
  );
};

export default SettingButton;
