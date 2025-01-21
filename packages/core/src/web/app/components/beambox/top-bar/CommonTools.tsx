import React from 'react';

import i18n from '@core/helpers/i18n';
import historyUtils from '@core/app/svgedit/history/utils';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';

import styles from './CommonTools.module.scss';

let svgEditor;
getSVGAsync((globalSVG) => {
  svgEditor = globalSVG.Editor;
});

const LANG = i18n.lang.topbar;

interface Props {
  isWeb: boolean;
  hide: boolean;
}

function CommonTools({ isWeb, hide }: Props): JSX.Element {
  const isMobile = useIsMobile();
  if (!isWeb || hide) return null;
  return (
    <div className={styles['common-tools-container']}>
      <div title={LANG.menu.undo} onClick={historyUtils.undo}>
        <TopBarIcons.Undo />
      </div>
      <div title={LANG.menu.redo} onClick={historyUtils.redo}>
        <TopBarIcons.Redo />
      </div>
      {!isMobile && (
        <div title={LANG.menu.delete} onClick={() => svgEditor.deleteSelected()}>
          <TopBarIcons.Trash />
        </div>
      )}
    </div>
  );
}

export default CommonTools;
