import React, { useCallback, useState } from 'react';

import { Input, Switch, Table } from 'antd';
import type { ColumnType } from 'antd/es/table';

import DraggableModal from '@core/app/widgets/DraggableModal';
import type { TemplateTargetLayer } from '@core/helpers/layer/templateTargetLayer';
import useI18n from '@core/helpers/useI18n';

interface Props {
  layers: TemplateTargetLayer[];
  onClose: () => void;
  resolve: (layers: null | TemplateTargetLayer[]) => void;
}

const TemplateTargetSettingModal = ({ layers: initData, onClose: onCloseModal, resolve }: Props) => {
  const t = useI18n().template_target_layer_setting;
  const [layers, setLayers] = useState(initData);

  const columns: Array<ColumnType<TemplateTargetLayer>> = [
    {
      dataIndex: 'value',
      title: t.layer_name,
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
      title: t.allow_import,
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
      title: t.display_name,
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
    <DraggableModal onCancel={onClose} onClose={onClose} onOk={onSave} open title={t.description}>
      <Table columns={columns} dataSource={layers} />
    </DraggableModal>
  );
};

export default TemplateTargetSettingModal;
