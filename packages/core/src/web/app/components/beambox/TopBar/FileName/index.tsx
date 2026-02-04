import React, { useEffect } from 'react';

import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import useForceUpdate from '@core/helpers/use-force-update';
import useI18n from '@core/helpers/useI18n';

import TopBarController from '../contexts/TopBarController';

import styles from './index.module.scss';

interface Props {
  hasUnsavedChange: boolean;
  isTitle?: boolean;
}

function FileName({ hasUnsavedChange, isTitle = false }: Props): React.JSX.Element {
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    TopBarController.onTitleChange(forceUpdate);

    return () => {
      TopBarController.offTitleChange(forceUpdate);
    };
  }, [forceUpdate]);

  const lang = useI18n().topbar;
  const { isCloudFile } = currentFileManager;
  const fileName = currentFileManager.getName() || lang.untitled;

  return (
    <div className={isTitle ? styles.title : styles['file-name']}>
      {isCloudFile && <TopBarIcons.CloudFile className={styles.cloud} />}
      {`${fileName}${hasUnsavedChange ? '*' : ''}`}
    </div>
  );
}

export default FileName;
