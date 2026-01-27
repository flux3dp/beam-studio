import React, { memo } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';

import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import useI18n from '@core/helpers/useI18n';

import { getGenerators } from './generators.config';
import styles from './Generators.module.scss';

const Generators = memo(() => {
  const t = useI18n().topbar.menu.tools;
  const tDrawer = useI18n().generators;
  const { setDrawerMode } = useCanvasStore();
  const workarea = useWorkarea();
  const generators = getGenerators({ isMobile: false, workarea }).filter((g) => g.visible !== false);

  const handleItemClick = (onClick: () => void) => {
    setDrawerMode('none');
    onClick();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{tDrawer.drawer_title}</h2>
        <div className={styles.actions}>
          <Button
            className={styles['icon-button']}
            icon={<CloseOutlined />}
            onClick={() => setDrawerMode('none')}
            shape="circle"
            type="text"
          />
        </div>
      </div>
      <div className={styles.list}>
        {generators.map((generator) => (
          <div
            className={classNames(styles.item)}
            key={generator.id}
            onClick={() => handleItemClick(generator.onClick)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleItemClick(generator.onClick);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <span className={styles.icon}>{generator.icon}</span>
            <span className={styles.label}>{t[generator.titleKey]}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default Generators;
