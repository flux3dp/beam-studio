/**
 * new Alert Modal using antd Modal
 */
import type { ReactNode } from 'react';
import React, { useContext, useMemo, useState } from 'react';

import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled, InfoCircleFilled } from '@ant-design/icons';
import { Button, Checkbox, Modal } from 'antd';
import classNames from 'classnames';

import { HELP_CENTER_URLS } from '@core/app/constants/alert-constants';
import { AlertProgressContext } from '@core/app/contexts/AlertProgressContext';
import AlertIcons from '@core/app/icons/alerts/AlertIcons';
import { useStorageStore } from '@core/app/stores/storageStore';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import type { IAlert, MessageIcon } from '@core/interfaces/IAlert';

import styles from './Alert.module.scss';

const renderIcon = (url?: string): ReactNode => {
  if (!url) {
    return null;
  }

  return <img className={styles.icon} src={url} />;
};

const messageIconMap: Record<MessageIcon, (props: any) => ReactNode> = {
  error: () => <CloseCircleFilled style={{ color: '#fe4348', fontSize: 28 }} />,
  info: () => <InfoCircleFilled style={{ color: '#1890ff', fontSize: 28 }} />,
  notice: () => <ExclamationCircleFilled style={{ color: '#faa22d', fontSize: 28 }} />,
  success: () => <CheckCircleFilled style={{ color: '#4fbb30', fontSize: 28 }} />,
  warning: () => <ExclamationCircleFilled style={{ color: '#faa22d', fontSize: 28 }} />,
};

const renderMessage = (message: ReactNode | string, messageIcon?: MessageIcon): ReactNode => {
  if (!message) {
    return null;
  }

  let content = null;
  const IconComponent = messageIcon ? messageIconMap[messageIcon] : null;

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

const Alert = ({
  data: {
    alwaysTriggerCheckboxCallbacks = true,
    animationSrcs,
    buttons,
    caption,
    checkbox,
    iconUrl,
    links,
    message,
    messageIcon,
    reverse = false,
    width = undefined,
  },
}: Props): React.JSX.Element => {
  const lang = useI18n().alert;
  const activeLang = useStorageStore((state) => state['active-lang']);
  const { popFromStack } = useContext(AlertProgressContext);
  const [checkboxChecked, setCheckboxChecked] = useState(false);

  const renderCheckbox = (): ReactNode => {
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

  const renderLink = (): ReactNode => {
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

    const isZhTw = activeLang === 'zh-tw';

    return (
      <div className={styles.links}>
        <Button
          className={styles.link}
          onClick={() => browser.open(isZhTw ? link.replace('en-us', 'zh-tw') : link)}
          type="link"
        >
          {lang.learn_more}
        </Button>
      </div>
    );
  };

  const animation = useMemo<ReactNode>(() => {
    if (!animationSrcs) return null;

    return (
      <video autoPlay className={styles.video} loop muted>
        {animationSrcs.map(({ src, type }) => (
          <source key={src} src={src} type={type} />
        ))}
      </video>
    );
  }, [animationSrcs]);

  if (reverse) {
    buttons = buttons?.toReversed();
  }

  const leftButtons: ReactNode[] = [];
  const rightButtons: ReactNode[] = [];

  buttons?.forEach(({ className, isLeft, label, onClick, type }, idx) => {
    const buttonType = type ?? (className?.includes('primary') ? 'primary' : 'default');

    (isLeft ? leftButtons : rightButtons).push(
      <Button
        key={label}
        onClick={() => {
          popFromStack();

          if (checkbox && checkboxChecked) {
            const { callbacks } = checkbox;

            if (typeof callbacks === 'function') {
              if (buttonType === 'primary' || alwaysTriggerCheckboxCallbacks) {
                callbacks(); // Only run for primary button
              }

              // Execute the button's onClick callback after checkbox's callback if provided
              onClick?.();
            } else if (callbacks.length > idx) {
              callbacks[idx]?.();
            } else {
              onClick?.();
            }
          } else {
            onClick?.();
          }
        }}
        type={buttonType as 'default' | 'primary'}
      >
        {label}
      </Button>,
    );
  });

  return (
    <Modal
      centered
      className={styles.container}
      closable={false}
      footer={
        <div className={styles.footer}>
          <div className={styles.left}>{leftButtons}</div>
          <div className={styles.right}>{rightButtons}</div>
        </div>
      }
      maskClosable={false}
      onCancel={popFromStack}
      open
      title={caption}
      width={width}
    >
      {renderIcon(iconUrl)}
      {renderMessage(message, messageIcon)}
      {animation}
      {renderLink()}
      {renderCheckbox()}
    </Modal>
  );
};

export default Alert;
