import React, { useEffect, useState } from 'react';

import { Button } from 'antd';
import classNames from 'classnames';

import DraggableModal from '@core/app/widgets/DraggableModal';
import useNewShortcutsScope from '@core/helpers/hooks/useNewShortcutsScope';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import BoxCanvas from './BoxCanvas';
import styles from './Boxgen.module.scss';
import BoxSelector from './BoxSelector';
import Controller from './Controller';
import ExportButton from './ExportButton';

interface Props {
  onClose: () => void;
}

const Boxgen = ({ onClose }: Props): React.JSX.Element => {
  const lang = useI18n();
  const isMobile = useIsMobile();
  const [isModalReady, setIsModalReady] = useState(false);

  useNewShortcutsScope();

  useEffect(() => {
    // Delay rendering the modal to avoid issues with shortcut scopes
    const timer = setTimeout(() => {
      setIsModalReady(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <DraggableModal
      footer={
        <div className={styles.footer}>
          <Button onClick={onClose}>{lang.global.cancel}</Button>
          <ExportButton onClose={onClose} />
        </div>
      }
      onCancel={onClose}
      open
      title={lang.topbar.menu.tools.box_generator}
      width={isMobile ? 'calc(100vw - 32px)' : 'min(1000px, calc(100vw - 32px))'}
      wrapClassName={styles['modal-wrap']}
    >
      <div className={classNames(styles.container, { [styles.mobile]: isMobile })}>
        <div className={styles.controls}>
          <BoxSelector />
          <Controller />
        </div>
        <div className={styles.canvas}>{isModalReady && <BoxCanvas />}</div>
      </div>
    </DraggableModal>
  );
};

export default Boxgen;
