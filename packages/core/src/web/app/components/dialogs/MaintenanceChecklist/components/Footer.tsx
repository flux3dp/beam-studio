import React from 'react';

import { HistoryOutlined, PrinterOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';

import useI18n from '@core/helpers/useI18n';

import printChecklist from '../printChecklist';
import { useMaintenanceData } from '../useMaintenanceData';
import { useMaintenanceStore } from '../useMaintenanceStore';

import styles from './Footer.module.scss';

/** Footer: maintenance tip plus history and print/PDF actions. */
const Footer = (): React.JSX.Element => {
  const t = useI18n().maintenance;
  const { machineName, material, record, schedule } = useMaintenanceData();
  const openHistory = useMaintenanceStore((state) => state.openHistory);

  return (
    <div className={styles.footer}>
      <span className={styles.tip}>{t.footer_tip}</span>
      <Space>
        <Button icon={<HistoryOutlined />} onClick={openHistory} type="text">
          {t.actions.history}
        </Button>
        <Button
          disabled={!schedule}
          icon={<PrinterOutlined />}
          onClick={() => schedule && printChecklist({ machineLabel: machineName, material, record, schedule })}
        >
          {t.actions.print}
        </Button>
      </Space>
    </div>
  );
};

export default Footer;
