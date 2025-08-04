import React from 'react';

import classNames from 'classnames';

import constant from '@core/app/actions/beambox/constant';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './DpiInfo.module.scss';

// TODO: Rearrange corner info/buttons together
const DpiInfo = (): React.JSX.Element => {
  const lang = useI18n().beambox.document_panel;
  const engraveDpi = useDocumentStore((state) => state.engrave_dpi);
  const isMobile = useIsMobile();

  return (
    <div className={classNames(styles.container, { [styles.mobile]: isMobile })}>
      <i>
        {lang.engrave_dpi}: {constant.dpiValueMap[engraveDpi]} DPI
      </i>
    </div>
  );
};

export default DpiInfo;
