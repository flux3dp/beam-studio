import React from 'react';

import { ExportOutlined, ImportOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Tooltip } from 'antd';

import useI18n from '@core/helpers/useI18n';

import styles from './ControlBar.module.scss';
import { showMaterialEditorModal } from './editors';
import { useMaterialBrowserStore } from './useMaterialBrowserStore';

interface ControlBarProps {
  onExport: () => void;
  onImport: () => void;
}

const ControlBar = ({ onExport, onImport }: ControlBarProps): React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  const { query, setQuery } = useMaterialBrowserStore();

  return (
    <div className={styles.controls}>
      <Input
        allowClear
        className={styles.search}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.search_placeholder}
        prefix={<SearchOutlined />}
        value={query}
      />
      <div className={styles.spacer} />
      <Button icon={<PlusOutlined />} onClick={() => showMaterialEditorModal()} type="primary">
        {t.add_material}
      </Button>
      <Tooltip title={t.import}>
        <Button aria-label={t.import} icon={<ImportOutlined />} onClick={onImport} />
      </Tooltip>
      <Tooltip title={t.export}>
        <Button aria-label={t.export} icon={<ExportOutlined />} onClick={onExport} />
      </Tooltip>
    </div>
  );
};

export default ControlBar;
