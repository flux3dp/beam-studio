import React, { useEffect } from 'react';

import { ClockCircleOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';

import useI18n from '@core/helpers/useI18n';

import styles from '../index.module.scss';
import { useAiGenerateStore } from '../useAiGenerateStore';

type Props = {
  contentRef: React.RefObject<HTMLDivElement>;
};

const Header = ({ contentRef }: Props) => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;
  const { resetForm, setState, showHistory, toggleHistory } = useAiGenerateStore();

  useEffect(() => {
    requestAnimationFrame(() => {
      contentRef.current?.scrollTo({ behavior: 'smooth', top: 0 });
    });
  }, [contentRef, showHistory]);

  return (
    <div className={styles.header}>
      <h2 className={styles.title}>{t.header.title}</h2>
      <div className={styles.actions}>
        <Tooltip title={t.header.history_tooltip}>
          <Button
            className={classNames(styles['icon-button'], { [styles.active]: showHistory })}
            icon={<ClockCircleOutlined />}
            onClick={toggleHistory}
            shape="circle"
            type="text"
          />
        </Tooltip>
        <Tooltip title={t.header.reset_tooltip}>
          <Button
            className={styles['icon-button']}
            icon={<ReloadOutlined />}
            onClick={resetForm}
            shape="circle"
            type="text"
          />
        </Tooltip>
        <Button
          className={styles['icon-button']}
          icon={<CloseOutlined />}
          onClick={() => setState({ isAiGenerateShown: false })}
          shape="circle"
          type="text"
        />
      </div>
    </div>
  );
};

export default Header;
