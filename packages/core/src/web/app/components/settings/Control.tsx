import * as React from 'react';

import classNames from 'classnames';

import { useIsMobile } from '@core/helpers/system-helper';

import browser from '@app/implementations/browser';

import styles from './Control.module.scss';

interface Props {
  children: React.JSX.Element | React.JSX.Element[];
  id?: string;
  label: string;
  url?: string;
  warningText?: string;
}

const Controls = ({ children, id = '', label, url = '', warningText = null }: Props): React.JSX.Element => {
  const isDesktop = !useIsMobile();
  const innerHtml = { __html: label };

  const warningIcon = () => {
    if (warningText) {
      return <img src="img/warning.svg" title={warningText} />;
    }

    return null;
  };

  const renderIcon = () => {
    if (url) {
      return (
        <span className="info-icon-small">
          <img
            onClick={() => {
              browser.open(url);
            }}
            src="img/info.svg"
          />
        </span>
      );
    }

    return null;
  };

  return (
    <div className={classNames('row-fluid', styles.control)} id={id}>
      <div className={classNames('no-left-margin', { span3: isDesktop, [styles.label]: isDesktop })}>
        <label className="font2" dangerouslySetInnerHTML={innerHtml} />
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
