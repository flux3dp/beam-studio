import React, { useContext, useState } from 'react';

import classNames from 'classnames';

import progressCaller from '@core/app/actions/progress-caller';
import { ElementPanelContext } from '@core/app/contexts/ElementPanelContext';
import HistoryCommandFactory from '@core/app/svgedit/history/HistoryCommandFactory';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import importSvg from '@core/app/svgedit/operations/import/importSvg';
import postImportElement from '@core/app/svgedit/operations/import/postImportElement';
import { getNPIconByID } from '@core/helpers/api/flux-id';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getLayerByName } from '@core/helpers/layer/layer-helper';
import webNeedConnectionWrapper from '@core/helpers/web-need-connection-helper';
import type { IIcon } from '@core/interfaces/INounProject';

import styles from './Element.module.scss';

const progressId = 'import-noun-project-svg';

const importNPSvg = async (id: string) => {
  progressCaller.openNonstopProgress({ id: progressId });

  try {
    const base64 = await getNPIconByID(id);

    if (!base64) return;

    const res = await fetch(base64);
    const blob = await res.blob();

    const batchCmd = HistoryCommandFactory.createBatchCommand('Import NP SVG');
    const layerName = layerManager.getCurrentLayerName();
    const layerModule = layerName ? getData(getLayerByName(layerName)!, 'module') : null;
    const elems = await importSvg(blob, {
      importType: 'layer',
      isFromNounProject: true,
      parentCmd: batchCmd,
      targetModule: layerModule,
    });

    if (!elems) return;

    for (const elem of elems) {
      await postImportElement(elem, batchCmd);
    }
    undoManager.addCommandToHistory(batchCmd);
  } finally {
    progressCaller.popById(progressId);
  }
};

const NPElement = ({ icon }: { icon: IIcon }) => {
  const { addToHistory, closeDrawer } = useContext(ElementPanelContext);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(icon.hidden);

  if (hasError) return null;

  return (
    <div
      className={classNames(styles.icon, { [styles.loading]: isLoading })}
      id={icon.id}
      onClick={async () => {
        if (!isLoading) {
          addToHistory({ npIcon: icon, type: 'np' });
          await webNeedConnectionWrapper(async () => {
            await importNPSvg(icon.id);
            closeDrawer();
          });
        }
      }}
    >
      <img
        onError={() => {
          icon.hidden = true;
          setHasError(true);
        }}
        onLoad={() => setIsLoading(false)}
        src={icon.thumbnail_url}
      />
    </div>
  );
};

export default NPElement;
