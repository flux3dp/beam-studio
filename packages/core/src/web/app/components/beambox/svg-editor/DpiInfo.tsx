import type { ReactNode } from 'react';
import React from 'react';

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

  if (!laserModules.has(module.value)) return null;

  return (
    <div className={classNames(styles.container, { [styles.mobile]: isMobile })}>
      <i>
        {lang.title}: {dpiValueMap[dpi.value]} DPI
      </i>
    </div>
  );
};

export default DpiInfo;
