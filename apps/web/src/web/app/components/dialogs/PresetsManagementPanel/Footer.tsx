import React from 'react';
import { Button } from 'antd';

import useI18n from 'helpers/useI18n';

import styles from './PresetsManagementPanel.module.scss';

interface Props {
  handleSave: () => void;
  handleReset: () => void;
  onClose: () => void;
}

const Footer = ({ handleSave, handleReset, onClose }: Props): JSX.Element => {
  const {
    global: tGlobal,
    beambox: {
      right_panel: {
        laser_panel: { preset_management: t },
      },
    },
  } = useI18n();

  return (
    <div className={styles.footer}>
      <div>
        <Button onClick={handleReset}>{t.reset}</Button>
      </div>
      <div>
        <Button onClick={onClose}>{tGlobal.cancel}</Button>
        <Button type="primary" onClick={handleSave}>
          {t.save_and_exit}
        </Button>
      </div>
    </div>
  );
};

export default Footer;
