import type { ReactNode } from 'react';
import React, { useMemo } from 'react';

import { Button } from 'antd';

import { useStorageStore } from '@core/app/stores/storageStore';
import DraggableModal from '@core/app/widgets/DraggableModal';
import isWeb from '@core/helpers/is-web';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import changelog from '@core/implementations/changelog';
import type { IChangeLogContent } from '@core/interfaces/IChangeLog';

import styles from './ChangeLog.module.scss';

interface Props {
  onClose: () => void;
}

function ChangeLog({ onClose }: Props): ReactNode {
  const { change_logs: t, global: tGlobal } = useI18n();
  const activeLang = useStorageStore((state) => state['active-lang']);
  const changeLogs = useMemo(() => {
    const CHANGES = activeLang?.startsWith('zh') ? changelog.CHANGES_TW : changelog.CHANGES_EN;
    const logs = [];

    for (const key of Object.keys(CHANGES) as Array<keyof IChangeLogContent>) {
      if (CHANGES[key].length > 0) {
        logs.push(<strong key={key}>{t[key]}</strong>);
        for (let i = 0; i < CHANGES[key].length; i += 1) {
          logs.push(
            <div className={styles.item} key={`${key}-${i}`}>
              <span className={styles.index}>{`${i + 1}.`}</span>
              <span className={styles.log}>{CHANGES[key][i]}</span>
            </div>,
          );
        }
      }
    }

    return logs;
  }, [activeLang, t]);

  if (changeLogs.length === 0) {
    onClose();

    return null;
  }

  const renderVersion = () => {
    const { version } = window.FLUX;

    if (isWeb()) return null;

    return (
      <div className="app">
        {`📖 Beam Studio ${version.replace('-', ' ')} `}
        {t.change_log}
      </div>
    );
  };

  return (
    <DraggableModal
      centered
      footer={[
        <Button key="older-version" onClick={() => browser.open(t.help_center_url)}>
          {t.see_older_version}
        </Button>,
        <Button key="ok" onClick={onClose} type="primary">
          {tGlobal.ok}
        </Button>,
      ]}
      onCancel={onClose}
      open
      scrollableContent
      title={renderVersion()}
    >
      <div>{changeLogs}</div>
    </DraggableModal>
  );
}

export default ChangeLog;
