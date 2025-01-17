/**
 * new Alert Modal using antd Modal
 */
import classNames from 'classnames';
import React, { useContext, useState } from 'react';
import { Button, Checkbox, Modal } from 'antd';

import AlertIcons from 'app/icons/alerts/AlertIcons';
import browser from 'implementations/browser';
import i18n from 'helpers/i18n';
import useI18n from 'helpers/useI18n';
import { AlertProgressContext } from 'app/contexts/AlertProgressContext';
import { HELP_CENTER_URLS } from 'app/constants/alert-constants';
import { IAlert, MessageIcon } from 'interfaces/IAlert';

import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  InfoCircleFilled,
} from '@ant-design/icons';
import styles from './Alert.module.scss';

const renderIcon = (url?: string): JSX.Element => {
  if (!url) return null;
  return <img className={styles.icon} src={url} />;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const messageIconMap: Record<MessageIcon, (props: any) => JSX.Element> = {
  success: () => <CheckCircleFilled style={{ fontSize: 28, color: '#4fbb30' }} />,
  info: () => <InfoCircleFilled style={{ fontSize: 28, color: '#1890ff' }} />,
  warning: () => <ExclamationCircleFilled style={{ fontSize: 28, color: '#faa22d' }} />,
  error: () => <CloseCircleFilled style={{ fontSize: 28, color: '#fe4348' }} />,
  notice: () => <ExclamationCircleFilled style={{ fontSize: 28, color: '#faa22d' }} />,
};

const renderMessage = (message: string | React.ReactNode, messageIcon = ''): JSX.Element => {
  if (!message) return null;
  let content = null;
  const IconComponent = messageIconMap[messageIcon];
  if (typeof message === 'string') {
    content = (
      <div
        className={classNames(styles.message, { [styles['with-icon']]: !!IconComponent })}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: message }}
      />
    );
  } else {
    content = (
      <div className={classNames(styles.message, { [styles['with-icon']]: !!IconComponent })}>
        {message}
      </div>
    );
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

const Alert = ({ data }: Props): JSX.Element => {
  const lang = useI18n().alert;
  const { popFromStack } = useContext(AlertProgressContext);
  const { caption, checkbox, message, messageIcon, buttons, iconUrl, links } = data;

  const [checkboxChecked, setCheckboxChecked] = useState(false);

  const renderCheckbox = (): JSX.Element => {
    if (!checkbox) return null;
    const { text } = checkbox;
    return (
      <div className={styles.checkbox}>
        <Checkbox onClick={() => setCheckboxChecked(!checkboxChecked)}>{text}</Checkbox>
      </div>
    );
  };

  const renderLink = (): JSX.Element => {
    if (links) {
      return (
        <div className={styles.links}>
          {links.map((link) => (
            <Button
              key={link.url}
              className={styles.link}
              type="link"
              onClick={() => browser.open(link.url)}
            >
              {link.text}
              <AlertIcons.ExtLink className={styles.icon} />
            </Button>
          ))}
        </div>
      );
    }
    if (typeof message !== 'string') return null;
    const errorCode = message.match('^#[0-9]*');
    if (!errorCode) return null;
    const link = HELP_CENTER_URLS[errorCode[0].replace('#', '')];
    if (!link) return null;
    const isZHTW = i18n.getActiveLang() === 'zh-tw';

    return (
      <div className={styles.links}>
        <Button
          className={styles.link}
          type="link"
          onClick={() => browser.open(isZHTW ? link.replace('en-us', 'zh-tw') : link)}
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
            if (callbacks.length > idx) callbacks[idx]?.();
            else if (typeof callbacks === 'function') callbacks?.();
            else button.onClick?.();
          } else button.onClick?.();
        }}
        type={buttonType}
      >
        {button.label}
      </Button>
    );
  });

  return (
    <Modal
      open
      title={caption}
      footer={footer}
      closable={false}
      maskClosable={false}
      centered
      onCancel={popFromStack}
      className={styles.container}
    >
      {renderIcon(iconUrl)}
      {renderMessage(message, messageIcon)}
      {renderLink()}
      {renderCheckbox()}
    </Modal>
  );
};

export default Alert;
