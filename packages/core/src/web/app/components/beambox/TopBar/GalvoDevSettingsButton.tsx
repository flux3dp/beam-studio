import React from 'react';

import { ExperimentOutlined } from '@ant-design/icons';

import { showGalvoDevSettings } from '@core/app/components/dialogs/GalvoDevSettings/showGalvoDevSettings';
import { useDocumentStore } from '@core/app/stores/documentStore';
import isDev from '@core/helpers/is-dev';

import styles from './GalvoDevSettingsButton.module.scss';

/**
 * Opens the HEXA II galvo developer overrides.
 *
 * Nothing behind it is a user-facing setting -- the values are swept on a real machine to tune
 * splitting and seam blending -- so it takes dev mode as well as the workarea. The workarea is
 * the document's, not the connected machine's: the settings travel with the job, so they are
 * worth reaching whether or not a machine is plugged in.
 */
const GalvoDevSettingsButton = (): null | React.JSX.Element => {
  const workarea = useDocumentStore((state) => state.workarea);

  if (workarea !== 'fhx2galvo' || !isDev()) return null;

  return (
    <div className={styles.button} onClick={showGalvoDevSettings} title="振鏡開發者設定">
      <ExperimentOutlined className={styles.icon} />
    </div>
  );
};

export default GalvoDevSettingsButton;
