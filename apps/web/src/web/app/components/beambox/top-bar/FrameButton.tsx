import classNames from 'classnames';
import React, { useContext, useEffect } from 'react';

import shortcuts from 'helpers/shortcuts';
import TopBarIcons from 'app/icons/top-bar/TopBarIcons';
import useI18n from 'helpers/useI18n';
import { CanvasContext } from 'app/contexts/CanvasContext';
import { CanvasMode } from 'app/constants/canvasMode';
import { showFramingModal } from 'app/components/dialogs/FramingModal';

import styles from './FrameButton.module.scss';

const FrameButton = (): JSX.Element => {
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
