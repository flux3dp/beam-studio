import React, { useContext, useMemo } from 'react';

import useI18n from 'helpers/useI18n';
import { TopBarHintsContext } from 'app/contexts/TopBarHintsContext';

import styles from './TopBarHints.module.scss';

const TopBarHints = (): JSX.Element => {
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
