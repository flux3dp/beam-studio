import React, { useEffect, useMemo } from 'react';

import classNames from 'classnames';

import { showFramingModal } from '@core/app/components/dialogs/FramingModal';
import { CanvasMode } from '@core/app/constants/canvasMode';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import shortcuts from '@core/helpers/shortcuts';
import useI18n from '@core/helpers/useI18n';

import styles from './FrameButton.module.scss';

const FrameButton = (): React.JSX.Element => {
  const lang = useI18n();
  const mode = useCanvasStore((state) => state.mode);
  const isDisabled = useMemo(() => mode !== CanvasMode.Draw, [mode]);

  useEffect(() => {
    if (isDisabled) return;

    const shortcutHandler = async () => {
      if (isDisabled) return;

      showFramingModal();
    };

    return shortcuts.on(['F1'], shortcutHandler);
  }, [isDisabled]);

  return (
    <div
      className={classNames(styles.button, { [styles.disabled]: isDisabled })}
      data-tutorial="frame-button"
      onClick={() => showFramingModal()}
      title={lang.topbar.frame_task}
    >
      <TopBarIcons.Frame />
    </div>
  );
};

export default FrameButton;
