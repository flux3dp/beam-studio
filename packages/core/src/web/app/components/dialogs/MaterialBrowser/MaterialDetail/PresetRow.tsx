import React from 'react';

import {
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  MoreOutlined,
  SwapOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Dropdown, Space, Tag } from 'antd';
import classNames from 'classnames';

import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { dpiValueMap } from '@core/app/constants/resolutions';
import type { ResolvedPresetRow } from '@core/helpers/api/material-catalog/selectors';
import useI18n from '@core/helpers/useI18n';
import type { PresetModel } from '@core/interfaces/ILayerConfig';

import styles from '../MaterialBrowser.module.scss';
import { getPresetDisplayParams } from '../utils/presetDisplayParams';

interface PresetRowProps {
  context: { model: PresetModel; module: LayerModuleType };
  onApply: (row: ResolvedPresetRow) => void;
  onDelete: (row: ResolvedPresetRow) => void;
  onEdit: (row: ResolvedPresetRow) => void;
  onMove: (row: ResolvedPresetRow) => void;
  onRestore: (row: ResolvedPresetRow) => void;
  onToggleDisabled: (row: ResolvedPresetRow) => void;
  row: ResolvedPresetRow;
}

const stateTagColor = { customized: 'orange', default: 'default', user: 'green' } as const;

const PresetRow = ({
  context,
  onApply,
  onDelete,
  onEdit,
  onMove,
  onRestore,
  onToggleDisabled,
  row,
}: PresetRowProps): React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  const stateLabel = { customized: t.state_customized, default: t.state_default, user: t.state_user }[row.state];

  const items: MenuProps['items'] = [
    { icon: <EditOutlined />, key: 'edit', label: t.edit },
    row.isDisabled
      ? { icon: <EyeOutlined />, key: 'enable', label: t.enable }
      : { icon: <EyeInvisibleOutlined />, key: 'disable', label: t.disable },
  ];

  if (row.state === 'customized') {
    items.push({ icon: <UndoOutlined />, key: 'restore', label: t.restore_default });
  }

  if (row.state === 'user') {
    items.push({ icon: <SwapOutlined />, key: 'move', label: t.move_to_material });
    items.push({ type: 'divider' });
    items.push({ danger: true, icon: <DeleteOutlined />, key: 'delete', label: t.delete });
  }

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'edit') onEdit(row);
    else if (key === 'restore') onRestore(row);
    else if (key === 'move') onMove(row);
    else if (key === 'delete') onDelete(row);
    else onToggleDisabled(row);
  };

  return (
    <div
      className={classNames(styles['preset-row'], { [styles.disabled]: row.isDisabled })}
      data-testid={`preset-row-${row.presetId}`}
    >
      <div className={styles.main}>
        <div className={styles.name}>
          {row.displayName}
          <Tag color={stateTagColor[row.state]} style={{ marginLeft: 8 }}>
            {stateLabel}
          </Tag>
          {row.values.dpi && (
            <Tag color="blue" style={{ marginLeft: 4 }}>
              {dpiValueMap[row.values.dpi]} DPI
            </Tag>
          )}
          {row.isDisabled && <Tag style={{ marginLeft: 4 }}>{t.state_disabled}</Tag>}
        </div>
        <Space className={styles.pills} size={[6, 6]} wrap>
          {getPresetDisplayParams(row.values, context).map(({ label, value }) => (
            <span className={styles.pill} key={label}>
              <b>{label}</b>
              {value}
            </span>
          ))}
        </Space>
      </div>
      <Button disabled={row.isDisabled} onClick={() => onApply(row)} type="primary">
        {t.apply}
      </Button>
      <Dropdown menu={{ items, onClick: onMenuClick }} trigger={['click']}>
        <Button data-testid={`preset-menu-${row.presetId}`} icon={<MoreOutlined />} type="text" />
      </Dropdown>
    </div>
  );
};

export default PresetRow;
