import React, { useState } from 'react';

import { ExportOutlined } from '@ant-design/icons';
import { Button, Switch } from 'antd';

import useI18n from '@core/helpers/useI18n';

import styles from '../index.module.scss';
import { usePrintAndCutStore } from '../store';
import { exportPrintAndCutPdf } from '../utils/exportPdf';

const StepExport = (): React.JSX.Element => {
  const { print_and_cut: t } = useI18n();
  const [isExporting, setIsExporting] = useState(false);
  const whiteMarkBase = usePrintAndCutStore((state) => state.whiteMarkBase);
  const setWhiteMarkBase = usePrintAndCutStore((state) => state.setWhiteMarkBase);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportPrintAndCutPdf();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={styles.content}>
      <div className={styles.desc}>{t.step_export_desc}</div>
      <div className={styles.row}>
        <span className={styles.label}>{t.white_mark_base}</span>
        <Switch checked={whiteMarkBase} onChange={setWhiteMarkBase} />
      </div>
      <Button block icon={<ExportOutlined />} loading={isExporting} onClick={handleExport} type="primary">
        {t.export_pdf}
      </Button>
    </div>
  );
};

export default StepExport;
