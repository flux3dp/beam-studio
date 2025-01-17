import React, { useContext, useEffect, useRef } from 'react';
import classNames from 'classnames';

import promarkButtonHandler from 'helpers/device/promark/promark-button-handler';
import shortcuts from 'helpers/shortcuts';
import useI18n from 'helpers/useI18n';
import TopBarIcons from 'app/icons/top-bar/TopBarIcons';
import { CanvasContext } from 'app/contexts/CanvasContext';
import { CanvasMode } from 'app/constants/canvasMode';
import { handleExportClick } from 'app/actions/beambox/export/GoButton/handleExportClick';

import styles from './GoButton.module.scss';

interface Props {
  hasDiscoverdMachine: boolean;
}

function throttle(func: () => void, delay: number): () => void {
  let timer = null;

  return () => {
    if (timer === null) {
      timer = setTimeout(() => {
        timer = null;
      }, delay);

      func();
    }
  };
}

const GoButton = ({ hasDiscoverdMachine }: Props): JSX.Element => {
  const lang = useI18n();
  const { mode, selectedDevice } = useContext(CanvasContext);
  const shortcutHandler = useRef<() => void>(null);

  useEffect(() => shortcuts.on(['F2'], () => shortcutHandler.current?.()), []);

  const throttledHandleExportClick = throttle(handleExportClick(lang), 2000);

  useEffect(() => {
    shortcutHandler.current = throttledHandleExportClick;
  }, [throttledHandleExportClick]);

  useEffect(() => {
    promarkButtonHandler.setExportFn(handleExportClick(lang));
  }, [lang]);

  useEffect(() => {
    promarkButtonHandler.onContextChanged(mode, selectedDevice);
  }, [mode, selectedDevice]);

  return (
    <div
      className={classNames(styles.button, {
        [styles.disabled]: !hasDiscoverdMachine || mode !== CanvasMode.Draw,
      })}
      onClick={throttledHandleExportClick}
      title={lang.tutorial.newInterface.start_work}
    >
      <TopBarIcons.Go />
    </div>
  );
};

export default GoButton;
