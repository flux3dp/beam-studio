/* eslint-disable react/require-default-props */
import * as React from 'react';
import classNames from 'classnames';

import browser from 'implementations/browser';
import { useIsMobile } from 'helpers/system-helper';

import styles from './Control.module.scss';

interface Props {
  id?: string,
  label: string,
  url?: string,
  warningText?: string,
  children: JSX.Element | JSX.Element[],
}

const Controls = ({
  id = '',
  label,
  url = '',
  warningText = null,
  children,
}: Props): JSX.Element => {
  const isDesktop = !useIsMobile();
  const innerHtml = { __html: label };

  const warningIcon = () => {
    if (warningText) {
      return (<img src="img/warning.svg" title={warningText} />);
    }
    return null;
  };

  const renderIcon = () => {
    if (url) {
      return (
        <span className="info-icon-small">
          <img src="img/info.svg" onClick={() => { browser.open(url); }} />
        </span>
      );
    }
    return null;
  };

  return (
    <div id={id} className={classNames('row-fluid', styles.control)}>
      <div
        className={classNames('no-left-margin', { span3: isDesktop, [styles.label]: isDesktop })}
      >
        <label
          className="font2"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={innerHtml}
        />
        {renderIcon()}
      </div>
      <div className={classNames('font3', { span8: isDesktop })}>
        {children}
        {warningIcon()}
      </div>
    </div>
  );
};

export default Controls;
