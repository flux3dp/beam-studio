import React from 'react';

import { ExperimentOutlined } from '@ant-design/icons';

import { showGalvoDevSettings } from '@core/app/components/dialogs/GalvoDevSettings/showGalvoDevSettings';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { checkHexa2GalvoDev } from '@core/helpers/checkFeature';

import styles from './GalvoDevSettingsButton.module.scss';

/**
 * Opens the HEXA II galvo developer overrides.
 *
 * Nothing behind it is a user-facing setting -- the values are swept on a real machine to tune
 * splitting and seam blending -- so it takes the HEXA II dev flag as well as the workarea. It is
 * the document's workarea, not the connected machine's: the settings travel with the job, so they
 * are worth reaching whether or not a machine is plugged in.
 */
const GalvoDevSettingsButton = (): null | React.JSX.Element => {
  const workarea = useDocumentStore((state) => state.workarea);

  if (workarea !== 'fhx2galvo' || !checkHexa2GalvoDev()) return null;

  return (
    <div className={styles.button} onClick={showGalvoDevSettings} title="振鏡開發者設定">
      <ExperimentOutlined className={styles.icon} />
    </div>
  );
};

export default GalvoDevSettingsButton;
