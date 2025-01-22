import React from 'react';

import { Button } from 'antd';

import useI18n from '@core/helpers/useI18n';

import styles from './PresetsManagementPanel.module.scss';

interface Props {
  handleReset: () => void;
  handleSave: () => void;
  onClose: () => void;
}

const Footer = ({ handleReset, handleSave, onClose }: Props): React.JSX.Element => {
  const {
    beambox: {
      right_panel: {
        laser_panel: { preset_management: t },
      },
    },
    global: tGlobal,
  } = useI18n();

  return (
    <div className={styles.footer}>
      <div>
        <Button onClick={handleReset}>{t.reset}</Button>
      </div>
      <div>
        <Button onClick={onClose}>{tGlobal.cancel}</Button>
        <Button onClick={handleSave} type="primary">
          {t.save_and_exit}
        </Button>
      </div>
    </div>
  );
};

export default Footer;
