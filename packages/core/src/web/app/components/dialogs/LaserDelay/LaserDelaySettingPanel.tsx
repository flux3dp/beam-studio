import React, { useState } from 'react';

import { UndoOutlined } from '@ant-design/icons';
import { Button, InputNumber, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import DraggableModal from '@core/app/widgets/DraggableModal';
import deviceMaster from '@core/helpers/device-master';

interface LaserDelaySettingPanelProps {
  initData: Record<string, number>;
  onClose: () => void;
}

interface DelayRow {
  delay: number;
  key: string;
  speed: string;
}

const LaserDelaySettingPanel = ({ initData, onClose }: LaserDelaySettingPanelProps): React.JSX.Element => {
  const [data, setData] = useState<Record<string, number>>(initData);

  const handleDelayChange = (speed: string, value: null | number) => {
    if (value === null) return;

    setData((prev) => ({ ...prev, [speed]: value }));
  };

  const handleSave = async () => {
    progressCaller.openNonstopProgress({ id: 'save-laser-delay', message: 'Saving laser delay settings' });

    try {
      // Parsing for shlex.split in python in ghost and firmware, ('\\\"' => '\"' (ghost) => '"' (firmware))
      await deviceMaster.setDeviceSetting('laser_delay', JSON.stringify(data).replaceAll('"', '\\\\\\"'));
      alertCaller.popUp({ message: 'Laser delay settings saved successfully', messageIcon: 'success' });
      onClose();
    } catch (error) {
      let errorMessage: string;

      if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        try {
          errorMessage = JSON.stringify(error);
        } catch {
          errorMessage = String(error);
        }
      }

      alertCaller.popUpError({ message: `Failed to save laser_delay: ${errorMessage}` });
    } finally {
      progressCaller.popById('save-laser-delay');
    }
  };

  const dataSource: DelayRow[] = Object.entries(data)
    .sort(([a], [b]) => {
      const numA = Number.parseInt(a.replace('S', ''), 10);
      const numB = Number.parseInt(b.replace('S', ''), 10);

      return numA - numB;
    })
    .map(([speed, delay]) => ({ delay, key: speed, speed }));

  const columns: ColumnsType<DelayRow> = [
    {
      dataIndex: 'speed',
      key: 'speed',
      title: 'Speed',
      width: 100,
    },
    {
      dataIndex: 'delay',
      key: 'delay',
      render: (_, record) => (
        <InputNumber
          max={1999}
          min={1001}
          onChange={(value) => handleDelayChange(record.speed, value)}
          precision={0}
          value={record.delay}
        />
      ),
      title: 'Delay Time (ns)',
    },
    {
      key: 'action',
      render: (_, record) =>
        record.delay !== initData[record.speed] ? (
          <Button
            icon={<UndoOutlined />}
            onClick={() => handleDelayChange(record.speed, initData[record.speed])}
            size="small"
            type="text"
          />
        ) : null,
      width: 40,
    },
  ];

  return (
    <DraggableModal
      centered
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="save" onClick={handleSave} type="primary">
          Save
        </Button>,
      ]}
      maskClosable={false}
      onCancel={onClose}
      open
      title="Laser Delay Setting"
      width={480}
    >
      <Table columns={columns} dataSource={dataSource} pagination={false} scroll={{ y: 400 }} size="small" />
    </DraggableModal>
  );
};

export default LaserDelaySettingPanel;
