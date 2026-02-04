import React, { memo, useCallback, useState } from 'react';

import { SettingFilled, SettingOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import useI18n from '@core/helpers/useI18n';

import ObjectPanelItem from '../ObjectPanelItem';

import styles from './FillBlock.module.scss';
import FillSettingModal from './FillSettingModal';

function FillBlock({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const [showModal, setShowModal] = useState(false);
  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);

  return (
    <>
      {type === 'panel-item' ? (
        <ObjectPanelItem.Item
          content={<SettingFilled className={styles['panel-icon']} />}
          id="fill-setting"
          label={t.fill_setting}
          onClick={openModal}
        />
      ) : (
        <div className={classNames(styles.panel, styles[type])}>
          <span className={styles.title}>
            {t.fill_setting}
            <span className={styles.icon} onClick={openModal} title={t.fill_setting}>
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
