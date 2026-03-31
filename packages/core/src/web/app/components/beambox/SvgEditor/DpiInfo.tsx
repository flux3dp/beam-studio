import type { ReactNode } from 'react';
import React, { useEffect, useState } from 'react';

import classNames from 'classnames';
import { pick } from 'remeda';
import { useShallow } from 'zustand/shallow';

import { laserModules } from '@core/app/constants/layer-module/layer-modules';
import { dpiValueMap } from '@core/app/constants/resolutions';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './DpiInfo.module.scss';

const DpiInfo = (): ReactNode => {
  const lang = useI18n().resolution;
  const { dpi, module } = useConfigPanelStore(useShallow(pick(['dpi', 'module'])));
  const isMobile = useIsMobile();

  const [isTargetScreen, setIsTargetScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const w = window.innerWidth;

      setIsTargetScreen(w === 600 || w === 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (isTargetScreen) return null;

  if (!laserModules.has(module.value)) return null;

  return (
    <div className={classNames(styles.container, { [styles.mobile]: isMobile })}>
      <span>
        {lang.title}: {dpiValueMap[dpi.value]} DPI
      </span>
    </div>
  );
};

export default DpiInfo;
