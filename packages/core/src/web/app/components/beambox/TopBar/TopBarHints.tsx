import React, { useContext, useMemo } from 'react';

import { TopBarHintsContext } from '@core/app/contexts/TopBarHintsContext';
import useI18n from '@core/helpers/useI18n';

import styles from './TopBarHints.module.scss';

const TopBarHints = (): React.JSX.Element => {
  const t = useI18n().topbar.hint;
  const { hintType } = useContext(TopBarHintsContext);
  const content = useMemo<React.ReactNode>(() => {
    if (hintType === 'POLYGON') {
      return <div>{t.polygon}</div>;
    }

    return null;
  }, [t, hintType]);

  return <div className={styles.container}>{content}</div>;
};

export default TopBarHints;
