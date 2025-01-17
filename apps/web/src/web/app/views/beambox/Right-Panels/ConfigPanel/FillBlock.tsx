import classNames from 'classnames';
import React, { memo, useCallback, useState } from 'react';
import { SettingFilled, SettingOutlined } from '@ant-design/icons';

import FillSettingModal from 'app/views/beambox/Right-Panels/ConfigPanel/FillSettingModal';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import useI18n from 'helpers/useI18n';

import styles from './FillBlock.module.scss';

function FillBlock({
  type = 'default',
}: {
  type?: 'default' | 'panel-item' | 'modal';
}): JSX.Element {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const [showModal, setShowModal] = useState(false);
  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);

  return (
    <>
      {type === 'panel-item' ? (
        <ObjectPanelItem.Item
          id="fill-setting"
          content={<SettingFilled className={styles['panel-icon']} />}
          label={t.fill_setting}
          onClick={openModal}
        />
      ) : (
        <div className={classNames(styles.panel, styles[type])}>
          <span className={styles.title}>
            {t.fill_setting}
            <span className={styles.icon} title={t.fill_setting} onClick={openModal}>
              <SettingOutlined className={styles.icon} />
            </span>
          </span>
        </div>
      )}
      {showModal && <FillSettingModal onClose={closeModal} />}
    </>
  );
}

export default memo(FillBlock);
