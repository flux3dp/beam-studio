import React from 'react';

import { ClockCircleOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';

import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import useI18n from '@core/helpers/useI18n';

import styles from '../index.module.scss';
import { useAiGenerateStore } from '../useAiGenerateStore';

const Header = () => {
  const t = useI18n().beambox.ai_generate;
  const { resetForm, showHistory, toggleHistory } = useAiGenerateStore();
  const { setDrawerMode } = useCanvasStore();

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
          onClick={() => setDrawerMode('none')}
          shape="circle"
          type="text"
        />
      </div>
    </div>
  );
};

export default Header;
