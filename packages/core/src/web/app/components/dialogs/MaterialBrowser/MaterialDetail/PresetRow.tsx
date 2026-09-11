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

import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { useMaterialStore } from '@core/app/stores/materialStore';
import type { ResolvedPresetRow } from '@core/helpers/api/material-catalog/selectors';
import useI18n from '@core/helpers/useI18n';
import type { PresetModel } from '@core/interfaces/ILayerConfig';

import { showMovePresetModal } from '../editors';
import { useMaterialBrowserStore } from '../useMaterialBrowserStore';
import { applyPresetRow } from '../utils/applyPresetRow';
import { getPresetDisplayParams } from '../utils/presetDisplayParams';

import styles from './PresetRow.module.scss';

interface PresetRowProps {
  context: { model: PresetModel; module: LayerModuleType };
  row: ResolvedPresetRow;
}

const stateTagColor = { customized: 'orange', default: 'default', user: 'green' } as const;

const PresetRow = ({ context, row }: PresetRowProps): React.JSX.Element => {
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

  // Store actions are read at click time so rows subscribe to nothing
  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    const { deletePreset, restorePreset, togglePresetDisabled } = useMaterialStore.getState();

    if (key === 'edit') {
      useMaterialBrowserStore
        .getState()
        .openPresetEditor({ materialId: row.materialId, mode: 'edit', presetId: row.presetId });
    } else if (key === 'restore') {
      restorePreset(row.presetId);
    } else if (key === 'move') {
      showMovePresetModal(row.presetId);
    } else if (key === 'delete') {
      alertCaller.popUp({
        buttonType: alertConstants.CONFIRM_CANCEL,
        message: t.sure_to_delete_preset,
        onConfirm: () => deletePreset(row.presetId),
      });
    } else {
      togglePresetDisabled(row.presetId);
    }
  };

  return (
    <div
      className={classNames(styles['preset-row'], { [styles.disabled]: row.isDisabled })}
      data-testid={`preset-row-${row.presetId}`}
    >
      <div className={styles.main}>
        <div className={styles.name}>
          {row.displayName}
          <Tag className={styles['state-tag']} color={stateTagColor[row.state]}>
            {stateLabel}
          </Tag>
          {row.isDisabled && <Tag className={styles['disabled-tag']}>{t.state_disabled}</Tag>}
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
      <Button disabled={row.isDisabled} onClick={() => applyPresetRow(row, context.module)} type="primary">
        {t.apply}
      </Button>
      <Dropdown menu={{ items, onClick: onMenuClick }} trigger={['click']}>
        <Button data-testid={`preset-menu-${row.presetId}`} icon={<MoreOutlined />} type="text" />
      </Dropdown>
    </div>
  );
};

export default PresetRow;
