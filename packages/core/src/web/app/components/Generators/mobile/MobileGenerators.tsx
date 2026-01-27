import React, { memo } from 'react';

import layoutConstants from '@core/app/constants/layout-constants';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import FloatingPanel from '@core/app/widgets/FloatingPanel';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import useI18n from '@core/helpers/useI18n';

import { getGenerators } from '../generators.config';

import styles from './MobileGenerators.module.scss';

const MobileGenerators = memo(() => {
  const t = useI18n().topbar.menu.tools;
  const tDrawer = useI18n().generators;
  const workarea = useWorkarea();
  const { setDrawerMode } = useCanvasStore();
  const generators = getGenerators({ isMobile: true, workarea }).filter((g) => g.visible !== false);
  // Single expanded state with full-screen capability
  const anchors = [0, window.innerHeight - layoutConstants.menubarHeight];

  const handleItemClick = (onClick: () => void) => {
    // Close the drawer and open the modal
    setDrawerMode('none');
    onClick();
  };

  const handleClose = () => {
    setDrawerMode('none');
  };

  return (
    <FloatingPanel anchors={anchors} className={styles.panel} onClose={handleClose} title={tDrawer.drawer_title}>
      <div className={styles.content}>
        <div className={styles.list}>
          {generators.map((generator) => (
            <div
              className={styles.item}
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
    </FloatingPanel>
  );
});

export default MobileGenerators;
