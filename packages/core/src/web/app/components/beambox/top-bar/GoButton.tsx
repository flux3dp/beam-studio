import React, { useContext, useEffect, useRef } from 'react';

import classNames from 'classnames';
import { funnel } from 'remeda';

import { handleExportClick } from '@core/app/actions/beambox/export/GoButton/handleExportClick';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import promarkButtonHandler from '@core/helpers/device/promark/promark-button-handler';
import shortcuts from '@core/helpers/shortcuts';
import useI18n from '@core/helpers/useI18n';

import styles from './GoButton.module.scss';

interface Props {
  hasDiscoverdMachine: boolean;
}

const GoButton = ({ hasDiscoverdMachine }: Props): React.JSX.Element => {
  const lang = useI18n();
  const { mode, selectedDevice } = useContext(CanvasContext);
  const shortcutHandler = useRef<() => void>(() => {});
  const throttledHandleExportClick = funnel(handleExportClick(lang), { minGapMs: 2000, triggerAt: 'start' });

  useEffect(() => shortcuts.on(['F2'], () => shortcutHandler.current()), []);

  useEffect(() => {
    shortcutHandler.current = throttledHandleExportClick.call;
  }, [throttledHandleExportClick]);

  useEffect(() => {
    promarkButtonHandler.setExportFn(handleExportClick(lang));
  }, [lang]);

  useEffect(() => {
    promarkButtonHandler.onContextChanged(mode, selectedDevice);
  }, [mode, selectedDevice]);

  return (
    <div
      className={classNames(styles.button, { [styles.disabled]: !hasDiscoverdMachine || mode !== CanvasMode.Draw })}
      onClick={throttledHandleExportClick.call}
      title={lang.tutorial.newInterface.start_work}
    >
      <TopBarIcons.Go />
    </div>
  );
};

export default GoButton;
