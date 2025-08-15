import React from 'react';

import type { ISVGEditor } from '@core/app/actions/beambox/svg-editor';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import historyUtils from '@core/app/svgedit/history/utils';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './CommonTools.module.scss';

let svgEditor: ISVGEditor;

getSVGAsync((globalSVG) => {
  svgEditor = globalSVG.Editor;
});

interface Props {
  hide: boolean;
}

function CommonTools({ hide }: Props): React.ReactNode {
  const t = useI18n().topbar.menu;
  const isMobile = useIsMobile();

  if (hide) {
    return null;
  }

  return (
    <div className={styles['common-tools-container']}>
      <div onClick={historyUtils.undo} title={t.undo}>
        <TopBarIcons.Undo />
      </div>
      <div onClick={historyUtils.redo} title={t.redo}>
        <TopBarIcons.Redo />
      </div>
      {!isMobile && (
        <div onClick={() => svgEditor.deleteSelected()} title={t.delete}>
          <TopBarIcons.Trash />
        </div>
      )}
    </div>
  );
}

export default CommonTools;
