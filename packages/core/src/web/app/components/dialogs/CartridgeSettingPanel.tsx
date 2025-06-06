import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button, Col, Input, InputNumber, Modal, Radio, Row, Tabs } from 'antd';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import Select from '@core/app/widgets/AntdSelect';
import deviceMaster from '@core/helpers/device-master';
import type { ChipSettings, RawChipSettings } from '@core/interfaces/Cartridge';

interface Props {
  initData: ChipSettings;
  inkLevel: number;
  onClose: () => void;
}

const initCapacity = 3.85e10;
const initPlScale = 54.8;

export const parsingChipData = (data: RawChipSettings): ChipSettings => ({
  brand: data.brand ?? '',
  color: data.color ?? 0,
  offset: data.pos_offset ?? [0, 0, 0],
  plScale: data.pl_scale ?? initPlScale,
  serial: data.serial ?? '',
  timeUsed: data.used_time ?? 0,
  totalCapacity: data.total_capacity ?? initCapacity,
  type: data.type ?? 0,
  uid: data.uid ?? '',
  verified: data.verified !== false,
});

const verifyChip = async (uid: string, privateKey: string, publicKey: string) => {
  if (deviceMaster.currentDevice?.control?.getMode() !== 'cartridge_io') {
    await deviceMaster.enterCartridgeIOMode();
  }

  try {
    let resp = await deviceMaster.cartridgeIOJsonRpcReq('cartridge.generate_chip_hash', [uid]);

    if (resp.status !== 'ok') {
      alertCaller.popUpError({ message: `generate_chip_hash failed ${JSON.stringify(resp)}}` });

      return false;
    }

    const { hash } = resp.data.result;

    resp = await deviceMaster.cartridgeIOJsonRpcReq('crypto.sign', [privateKey, hash]);

    if (resp.status !== 'ok') {
      alertCaller.popUpError({ message: `crypto.sign failed ${JSON.stringify(resp)}}` });

      return false;
    }

    const { sign } = resp.data.result;

    resp = await deviceMaster.cartridgeIOJsonRpcReq('crypto.verify', [publicKey, hash, sign]);

    if (resp.status !== 'ok' || !resp.data.result) {
      alertCaller.popUpError({ message: `crypto.verify failed ${JSON.stringify(resp)}}` });

      return false;
    }

    resp = await deviceMaster.cartridgeIOJsonRpcReq('cartridge.load_sign_data', [hash, sign]);

    if (resp.status !== 'ok' || !resp.data.result) {
      alertCaller.popUpError({
        message: `cartridge.load_sign_data failed ${JSON.stringify(resp)}}`,
      });

      return false;
    }

    return resp.data.result;
  } catch (error) {
    const message = error.error ? JSON.stringify(error) : error.message;

    alertCaller.popUpError({ message: `Failed to verify chip: ${message}` });

    return false;
  }
};

const writeChipData = async (data: ChipSettings) => {
  try {
    if (deviceMaster.currentDevice?.control?.getMode() !== 'cartridge_io') {
      await deviceMaster.enterCartridgeIOMode();
    }

    const params = [data.brand, data.serial, data.color, data.type, data.offset, data.plScale, data.totalCapacity];
    const resp = await deviceMaster.cartridgeIOJsonRpcReq('cartridge.write_mfg_info', params);

    if (resp.status !== 'ok' || !resp.data.result) {
      alertCaller.popUpError({
        message: `cartridge.write_mfg_info failed ${JSON.stringify(resp)}}`,
      });

      return false;
    }

    return true;
  } catch (error) {
    const message = error.error ? JSON.stringify(error) : error.message;

    alertCaller.popUpError({ message: `Failed to verify chip: ${message}` });

    return false;
  }
};

let publicKeyCache = '';
let privateKeyCache = '';
let editValueCache: ChipSettings = null;

const CartridgeSettingPanel = ({ initData, inkLevel, onClose }: Props): React.JSX.Element => {
  const [publicKey, setPublicKey] = useState(publicKeyCache);
  const [privateKey, setPrivateKey] = useState(privateKeyCache);
  const [chipSettings, setChipSettings] = useState<ChipSettings>(initData);
  const [editingValues, setEditingValues] = useState<ChipSettings>(
    editValueCache ?? { ...initData, plScale: initPlScale, totalCapacity: initCapacity },
  );
  const [tabKey, setTabKey] = useState<string>('info');
  const handleSave = async () => {
    progressCaller.openNonstopProgress({ id: 'chip-settings', message: 'Saving Chip Data' });

    const res = await writeChipData(editingValues);

    progressCaller.popById('chip-settings');
    // deep copy
    editValueCache = JSON.parse(JSON.stringify(editingValues));

    if (res) {
      onClose();
    }
  };
  const tabItems = useMemo(
    () => [
      {
        children: null,
        key: 'info',
        label: 'Info',
      },
      {
        children: null,
        key: 'edit',
        label: 'Edit',
      },
    ],
    [],
  );
  const fetchChipSettings = useCallback(async () => {
    progressCaller.openNonstopProgress({
      id: 'chip-settings',
      message: 'Fetching Chip Data',
    });

    if (deviceMaster.currentDevice?.control?.getMode() !== 'cartridge_io') {
      await deviceMaster.enterCartridgeIOMode();
    }

    const chipData = await deviceMaster.getCartridgeChipData();
    const parsed = parsingChipData(chipData.data.result);

    setChipSettings(parsed);

    if (!editValueCache) {
      setEditingValues({ ...parsed, plScale: initPlScale, totalCapacity: initCapacity });
    }

    progressCaller.popById('chip-settings');
  }, []);

  useEffect(
    () => () => {
      if (deviceMaster.currentDevice?.control?.getMode() === 'cartridge_io') {
        deviceMaster.endSubTask();
      }
    },
    [],
  );

  const colorSelectOptions = useMemo(
    () => [
      { label: 'None', value: 0 },
      { label: 'Cyan', value: 1 },
      { label: 'Magenta', value: 2 },
      { label: 'Yellow', value: 3 },
      { label: 'Black', value: 4 },
      { label: 'White', value: 5 },
    ],
    [],
  );

  const handleVerify = async () => {
    const res = await verifyChip(chipSettings.uid, privateKey, publicKey);

    if (res) {
      fetchChipSettings();
    }
  };

  const handleTabChange = (key: string) => {
    setTabKey(key);
  };
  const isEditing = tabKey === 'edit';
  const values = isEditing ? editingValues : chipSettings;

  return (
    <Modal
      centered
      maskClosable={false}
      okButtonProps={{ disabled: !isEditing || !values.verified }}
      okText="Save"
      onCancel={onClose}
      onOk={handleSave}
      open
      title="Catridge Chip Settings"
      width={600}
    >
      <Row gutter={[8, 8]}>
        {!values.verified && (
          <>
            <Col span={4}>Public Key</Col>
            <Col span={20}>
              <Input
                onChange={(e) => {
                  const { value } = e.currentTarget;

                  setPublicKey(value);
                  publicKeyCache = value;
                }}
                value={publicKey}
              />
            </Col>
            <Col span={4}>Private Key</Col>
            <Col span={20}>
              <Input
                onChange={(e) => {
                  const { value } = e.currentTarget;

                  setPrivateKey(value);
                  privateKeyCache = value;
                }}
                value={privateKey}
              />
            </Col>
          </>
        )}
        <Col span={20}>
          <Input disabled value={values.uid} />
        </Col>
        <Col span={4}>
          <Button onClick={values.verified ? fetchChipSettings : handleVerify} type="primary">
            {values.verified ? 'Reload' : 'Verify'}
          </Button>
        </Col>
      </Row>
      {values.verified ? (
        <>
          <Tabs activeKey={tabKey} items={tabItems} onChange={handleTabChange} />
          <Row gutter={[8, 8]}>
            <Col span={8}>Serial</Col>
            <Col span={16}>
              <Input
                disabled={!isEditing}
                onChange={(e) => setEditingValues({ ...editingValues, serial: e.currentTarget.value })}
                value={values.serial}
              />
            </Col>
            <Col span={8}>Brand</Col>
            <Col span={16}>
              <Input
                disabled={!isEditing}
                onChange={(e) => setEditingValues({ ...editingValues, brand: e.currentTarget.value })}
                value={values.brand}
              />
            </Col>
            <Col span={8}>Type</Col>
            <Col span={16}>
              <Radio.Group
                buttonStyle="solid"
                disabled={!isEditing}
                onChange={(e) => setEditingValues({ ...editingValues, type: e.target.value })}
                optionType="button"
                value={values.type}
              >
                <Radio value={0}>None</Radio>
                <Radio value={1}>SV</Radio>
                <Radio value={2}>UV</Radio>
              </Radio.Group>
            </Col>
            <Col span={8}>Color</Col>
            <Col span={16}>
              <Select
                disabled={!isEditing}
                onChange={(value) => setEditingValues({ ...editingValues, color: value })}
                options={colorSelectOptions}
                value={values.color}
              />
            </Col>
            <Col span={24}>Calibration</Col>
            <Col span={8}>
              <InputNumber
                addonAfter="mm"
                addonBefore="X"
                disabled={!isEditing}
                onChange={(val) =>
                  setEditingValues({
                    ...editingValues,
                    offset: [val, editingValues.offset[1], editingValues.offset[2]],
                  })
                }
                precision={2}
                step={0.01}
                value={values.offset?.[0] ?? 0}
              />
            </Col>
            <Col span={8}>
              <InputNumber
                addonAfter="mm"
                addonBefore="Y"
                disabled={!isEditing}
                onChange={(val) =>
                  setEditingValues({
                    ...editingValues,
                    offset: [editingValues.offset[0], val, editingValues.offset[2]],
                  })
                }
                precision={2}
                step={0.01}
                value={values.offset?.[1] ?? 0}
              />
            </Col>
            <Col span={8}>
              <InputNumber
                addonAfter="mm"
                addonBefore="Z"
                disabled={!isEditing}
                onChange={(val) =>
                  setEditingValues({
                    ...editingValues,
                    offset: [editingValues.offset[0], editingValues.offset[1], val],
                  })
                }
                precision={2}
                step={0.01}
                value={values.offset?.[2] ?? 0}
              />
            </Col>
            <Col span={8}>PL Scale</Col>
            <Col span={16}>
              <InputNumber
                disabled={!isEditing}
                onChange={(val) => setEditingValues({ ...editingValues, plScale: val })}
                value={values.plScale}
              />
            </Col>
            <Col span={8}>Total Capacity</Col>
            <Col span={16}>
              <InputNumber
                disabled={!isEditing}
                onChange={(val) => setEditingValues({ ...editingValues, totalCapacity: val })}
                value={values.totalCapacity}
              />
            </Col>
            <Col span={8}>Ink Storage</Col>
            <Col span={16}>
              <InputNumber addonAfter="%" disabled precision={2} value={inkLevel * 100} />
            </Col>
            <Col span={8}>Time Used</Col>
            <Col span={16}>
              <InputNumber addonAfter="hr" disabled value={values.timeUsed} />
            </Col>
          </Row>
        </>
      ) : (
        <div>Not verified</div>
      )}
    </Modal>
  );
};

export default CartridgeSettingPanel;
