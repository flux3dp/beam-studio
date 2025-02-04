/**
 * new Alert Modal using antd Modal
 */
import React, { useContext, useState } from 'react';

import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled, InfoCircleFilled } from '@ant-design/icons';
import { Button, Checkbox, Modal } from 'antd';
import classNames from 'classnames';

import { HELP_CENTER_URLS } from '@core/app/constants/alert-constants';
import { AlertProgressContext } from '@core/app/contexts/AlertProgressContext';
import AlertIcons from '@core/app/icons/alerts/AlertIcons';
import i18n from '@core/helpers/i18n';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import type { IAlert, MessageIcon } from '@core/interfaces/IAlert';

import styles from './Alert.module.scss';

const renderIcon = (url?: string): React.JSX.Element => {
  if (!url) {
    return null;
  }

  return <img className={styles.icon} src={url} />;
};

const messageIconMap: Record<MessageIcon, (props: any) => React.JSX.Element> = {
  error: () => <CloseCircleFilled style={{ color: '#fe4348', fontSize: 28 }} />,
  info: () => <InfoCircleFilled style={{ color: '#1890ff', fontSize: 28 }} />,
  notice: () => <ExclamationCircleFilled style={{ color: '#faa22d', fontSize: 28 }} />,
  success: () => <CheckCircleFilled style={{ color: '#4fbb30', fontSize: 28 }} />,
  warning: () => <ExclamationCircleFilled style={{ color: '#faa22d', fontSize: 28 }} />,
};

const renderMessage = (message: React.ReactNode | string, messageIcon = ''): React.JSX.Element => {
  if (!message) {
    return null;
  }

  let content = null;
  const IconComponent = messageIconMap[messageIcon];

  if (typeof message === 'string') {
    content = (
      <div
        className={classNames(styles.message, { [styles['with-icon']]: !!IconComponent })}
        dangerouslySetInnerHTML={{ __html: message }}
      />
    );
  } else {
    content = <div className={classNames(styles.message, { [styles['with-icon']]: !!IconComponent })}>{message}</div>;
  }

  return (
    <div className={styles['message-container']}>
      {IconComponent && <IconComponent className={styles.icon} />}
      {content}
    </div>
  );
};

interface Props {
  data: IAlert;
}

const Alert = ({ data }: Props): React.JSX.Element => {
  const lang = useI18n().alert;
  const { popFromStack } = useContext(AlertProgressContext);
  const { buttons, caption, checkbox, iconUrl, links, message, messageIcon } = data;

  const [checkboxChecked, setCheckboxChecked] = useState(false);

  const renderCheckbox = (): React.JSX.Element => {
    if (!checkbox) {
      return null;
    }

    const { text } = checkbox;

    return (
      <div className={styles.checkbox}>
        <Checkbox onClick={() => setCheckboxChecked(!checkboxChecked)}>{text}</Checkbox>
      </div>
    );
  };

  const renderLink = (): React.JSX.Element => {
    if (links) {
      return (
        <div className={styles.links}>
          {links.map((link) => (
            <Button className={styles.link} key={link.url} onClick={() => browser.open(link.url)} type="link">
              {link.text}
              <AlertIcons.ExtLink className={styles.icon} />
            </Button>
          ))}
        </div>
      );
    }

    if (typeof message !== 'string') {
      return null;
    }

    const errorCode = message.match('^#[0-9]*');

    if (!errorCode) {
      return null;
    }

    const link = HELP_CENTER_URLS[errorCode[0].replace('#', '')];

    if (!link) {
      return null;
    }

    const isZHTW = i18n.getActiveLang() === 'zh-tw';

    return (
      <div className={styles.links}>
        <Button
          className={styles.link}
          onClick={() => browser.open(isZHTW ? link.replace('en-us', 'zh-tw') : link)}
          type="link"
        >
          {lang.learn_more}
        </Button>
      </div>
    );
  };

  const footer = buttons?.map((button, idx) => {
    const buttonType = button.className?.includes('primary') ? 'primary' : 'default';

    return (
      <Button
        key={button.label}
        onClick={() => {
          popFromStack();

          if (checkbox && checkboxChecked) {
            const { callbacks } = checkbox;

            if (callbacks.length > idx) {
              callbacks[idx]?.();
            } else if (typeof callbacks === 'function') {
              callbacks?.();
            } else {
              button.onClick?.();
            }
          } else {
            button.onClick?.();
          }
        }}
        type={buttonType}
      >
        {button.label}
      </Button>
    );
  });

  return (
    <Modal
      centered
      className={styles.container}
      closable={false}
      footer={footer}
      maskClosable={false}
      onCancel={popFromStack}
      open
      title={caption}
    >
      {renderIcon(iconUrl)}
      {renderMessage(message, messageIcon)}
      {renderLink()}
      {renderCheckbox()}
    </Modal>
  );
};

export default Alert;
