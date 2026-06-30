import React, { useCallback, useState } from 'react';

import { Input, Switch, Table } from 'antd';
import type { ColumnType } from 'antd/es/table';

import DraggableModal from '@core/app/widgets/DraggableModal';
import { mockT } from '@core/helpers/is-dev';
import type { TemplateTargetLayer } from '@core/helpers/layer/templateTargetLayer';

interface Props {
  layers: TemplateTargetLayer[];
  onClose: () => void;
  resolve: (layers: null | TemplateTargetLayer[]) => void;
}

const TemplateTargetSettingModal = ({ layers: initData, onClose: onCloseModal, resolve }: Props) => {
  const [layers, setLayers] = useState(initData);

  const columns: Array<ColumnType<TemplateTargetLayer>> = [
    {
      dataIndex: 'value',
      title: mockT('圖層名稱'),
    },
    {
      key: 'isTarget',
      render: (_, record, index) => (
        <Switch
          checked={!!record.label}
          onChange={(checked) =>
            setLayers((prev) => {
              prev[index] = { ...record, label: checked ? initData[index].label || record.value : null };

              return [...prev];
            })
          }
        />
      ),
      title: mockT('允許匯入'),
    },
    {
      dataIndex: 'label',
      render: (label, _, index) =>
        label ? (
          <Input
            defaultValue={label}
            onBlur={(e) =>
              setLayers((prev) => {
                prev[index] = { ...prev[index], label: e.target.value || null };

                return [...prev];
              })
            }
          />
        ) : null,
      title: mockT('顯示名稱'),
    },
  ];

  const onClose = useCallback(() => {
    resolve(null);
    onCloseModal();
  }, [resolve, onCloseModal]);

  const onSave = useCallback(() => {
    resolve(layers);
    onCloseModal();
  }, [layers, resolve, onCloseModal]);

  return (
    <DraggableModal onCancel={onClose} onClose={onClose} onOk={onSave} open title={mockT('設置客戶可以匯入的圖層')}>
      <Table columns={columns} dataSource={layers} />
    </DraggableModal>
  );
};

export default TemplateTargetSettingModal;
