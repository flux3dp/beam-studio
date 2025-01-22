import React from 'react';

import { Button, Modal } from 'antd';

import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';

import browser from '@app/implementations/browser';
import changelog from '@app/implementations/changelog';

const LANG = i18n.lang.change_logs;

interface Props {
  onClose: () => void;
}

function ChangeLog({ onClose }: Props): React.JSX.Element {
  const renderChangeLogs = () => {
    const CHANGES = i18n.getActiveLang().startsWith('zh') ? changelog.CHANGES_TW : changelog.CHANGES_EN;
    const logs = [];

    for (const key of Object.keys(CHANGES)) {
      if (CHANGES[key].length > 0) {
        logs.push(
          <strong className="change-log-category" key={key}>
            {LANG[key]}
          </strong>,
        );
        for (let i = 0; i < CHANGES[key].length; i += 1) {
          logs.push(
            <div className="change-log-item" key={`${key}-${i}`}>
              <span className="index">{`${i + 1}.`}</span>
              <span className="log">{CHANGES[key][i]}</span>
            </div>,
          );
        }
      }
    }

    return logs;
  };

  const changeLogs = renderChangeLogs();

  if (changeLogs.length === 0) {
    onClose();

    return null;
  }

  const renderVersion = () => {
    const { version } = window.FLUX;

    if (isWeb()) {
      return null;
    }

    return (
      <div className="app">
        {`📖 Beam Studio ${version.replace('-', ' ')} `}
        {LANG.change_log}
      </div>
    );
  };

  const handleLink = () => {
    browser.open(LANG.help_center_url);
  };

  return (
    <Modal
      centered
      footer={[
        <Button key="older-version" onClick={handleLink}>
          {LANG.see_older_version}
        </Button>,
        <Button key="ok" onClick={onClose} type="primary">
          OK
        </Button>,
      ]}
      onCancel={onClose}
      open
      title={renderVersion()}
    >
      <div className="change-log-container">{changeLogs}</div>
    </Modal>
  );
}

export default ChangeLog;
