import React, { useContext, useEffect } from 'react';

import classNames from 'classnames';

import { showFramingModal } from '@core/app/components/dialogs/FramingModal';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import shortcuts from '@core/helpers/shortcuts';
import useI18n from '@core/helpers/useI18n';

import styles from './FrameButton.module.scss';

const FrameButton = (): React.JSX.Element => {
  const lang = useI18n();
  const { mode } = useContext(CanvasContext);

  useEffect(() => {
    const shortcutHandler = async () => {
      if (mode !== CanvasMode.Draw) {
        return;
      }

      showFramingModal();
    };

    return shortcuts.on(['F1'], shortcutHandler);
  }, [mode]);

  return (
    <div
      className={classNames(styles.button, { [styles.disabled]: mode !== CanvasMode.Draw })}
      onClick={() => showFramingModal()}
      title={lang.topbar.frame_task}
    >
      <TopBarIcons.Frame />
    </div>
  );
};

export default FrameButton;
