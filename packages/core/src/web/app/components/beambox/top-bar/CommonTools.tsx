import React from 'react';

import type { ISVGEditor } from '@core/app/actions/beambox/svg-editor';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import historyUtils from '@core/app/svgedit/history/utils';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';

import styles from './CommonTools.module.scss';

let svgEditor: ISVGEditor;

getSVGAsync((globalSVG) => {
  svgEditor = globalSVG.Editor;
});

const LANG = i18n.lang.topbar;

interface Props {
  hide: boolean;
}

function CommonTools({ hide }: Props): React.ReactNode {
  const isMobile = useIsMobile();

  if (hide) {
    return null;
  }

  return (
    <div className={styles['common-tools-container']}>
      <div onClick={historyUtils.undo} title={LANG.menu.undo}>
        <TopBarIcons.Undo />
      </div>
      <div onClick={historyUtils.redo} title={LANG.menu.redo}>
        <TopBarIcons.Redo />
      </div>
      {!isMobile && (
        <div onClick={() => svgEditor.deleteSelected()} title={LANG.menu.delete}>
          <TopBarIcons.Trash />
        </div>
      )}
    </div>
  );
}

export default CommonTools;
