import React, { useEffect } from 'react';

import ReactDomServer from 'react-dom/server';

import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import TopBarController from '@core/app/views/beambox/TopBar/contexts/TopBarController';
import useForceUpdate from '@core/helpers/use-force-update';
import useI18n from '@core/helpers/useI18n';

import styles from './FileName.module.scss';

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

const updateTitle = () => {
  if (window.os === 'Windows' && window.titlebar) {
    const title = ReactDomServer.renderToStaticMarkup(<FileName hasUnsavedChange={false} isTitle />);

    if (window.titlebar?.title) {
      window.titlebar.title.innerHTML = title;
    }
  }
};

export const registerWindowUpdateTitle = (): void => {
  TopBarController.onTitleChange(updateTitle);
};

export const unregisterWindowUpdateTitle = (): void => {
  TopBarController.offTitleChange(updateTitle);
};

export default FileName;
