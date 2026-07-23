import React, { memo, useCallback, useState } from 'react';

import { SettingOutlined } from '@ant-design/icons';

import useI18n from '@core/helpers/useI18n';

import styles from './FillBlock.module.scss';
import FillSettingModal from './FillSettingModal';

function FillBlock(): React.JSX.Element {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const [showModal, setShowModal] = useState(false);
  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);

  return (
    <>
      {
        <div className={styles.panel}>
          <span className={styles.title}>
            {t.fill_setting}
            <span className={styles.icon} onClick={openModal} title={t.fill_setting}>
              <SettingOutlined className={styles.icon} />
            </span>
          </span>
        </div>
      }
      {showModal && <FillSettingModal onClose={closeModal} />}
    </>
  );
}

export default memo(FillBlock);
