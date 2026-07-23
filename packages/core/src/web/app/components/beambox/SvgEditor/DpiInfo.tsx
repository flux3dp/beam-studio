import React, { type ReactNode } from 'react';

import { pick } from 'remeda';
import { useShallow } from 'zustand/shallow';

import { laserModules } from '@core/app/constants/layer-module/layer-modules';
import { dpiValueMap } from '@core/app/constants/resolutions';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useI18n from '@core/helpers/useI18n';

import styles from './DpiInfo.module.scss';

const DpiInfo = (): ReactNode => {
  const lang = useI18n().resolution;
  const { dpi, module } = useConfigPanelStore(useShallow(pick(['dpi', 'module'])));

  if (!laserModules.has(module.value)) return null;

  return (
    <div className={styles.container}>
      <span>
        {lang.title}: {dpiValueMap[dpi.value]} DPI
      </span>
    </div>
  );
};

export default DpiInfo;
