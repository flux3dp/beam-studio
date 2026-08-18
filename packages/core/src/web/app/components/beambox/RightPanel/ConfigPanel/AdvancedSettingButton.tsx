import React, { memo, useCallback, useState } from 'react';

import { SettingFilled, SettingOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';

import useI18n from '@core/helpers/useI18n';

import ObjectPanelItem from '../ObjectPanelItem';

import styles from './AdvancedSettingButton.module.scss';
import AdvancedSettingModal from './AdvancedSettingModal';

function AdvancedSettingButton({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element {
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
          id="advanced-setting"
          label={t.advanced}
          onClick={openModal}
        />
      ) : (
        <div className={classNames(styles.panel, styles[type])}>
          <Button block icon={<SettingOutlined />} id="advanced-setting" onClick={openModal}>
            {t.advanced}
          </Button>
        </div>
      )}
      {showModal && <AdvancedSettingModal onClose={closeModal} />}
    </>
  );
}

export default memo(AdvancedSettingButton);
