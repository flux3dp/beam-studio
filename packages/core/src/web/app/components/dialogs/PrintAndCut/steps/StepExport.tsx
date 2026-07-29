import React, { useState } from 'react';

import { ExportOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import useI18n from '@core/helpers/useI18n';

import styles from '../index.module.scss';
import { exportPrintAndCutPdf } from '../utils/exportPdf';

const StepExport = (): React.JSX.Element => {
  const lang = useI18n().print_and_cut;
  const [isExporting, setIsExporting] = useState(false);

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
      <div className={styles.desc}>{lang.step_export_desc}</div>
      <Button block icon={<ExportOutlined />} loading={isExporting} onClick={handleExport} type="primary">
        {lang.export_pdf}
      </Button>
    </div>
  );
};

export default StepExport;
