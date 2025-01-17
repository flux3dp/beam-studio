import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Col, Input, InputNumber, Modal, Radio, Row, Tabs } from 'antd';

import alertCaller from 'app/actions/alert-caller';
import deviceMaster from 'helpers/device-master';
import progressCaller from 'app/actions/progress-caller';
import Select from 'app/widgets/AntdSelect';
import { ChipSettings, RawChipSettings } from 'interfaces/Cartridge';

interface Props {
  inkLevel: number;
  initData: ChipSettings;
  onClose: () => void;
}

const initCapacity = 3.85e10;
const initPlScale = 54.8;

export const parsingChipData = (data: RawChipSettings): ChipSettings => ({
  uid: data.uid ?? '',
  serial: data.serial ?? '',
  brand: data.brand ?? '',
  type: data.type ?? 0,
  color: data.color ?? 0,
  offset: data.pos_offset ?? [0, 0, 0],
  plScale: data.pl_scale ?? initPlScale,
  totalCapacity: data.total_capacity ?? initCapacity,
  timeUsed: data.used_time ?? 0,
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
    const params = [
      data.brand,
      data.serial,
      data.color,
      data.type,
      data.offset,
      data.plScale,
      data.totalCapacity,
    ];
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

const CartridgeSettingPanel = ({ inkLevel, initData, onClose }: Props): JSX.Element => {
  const [publicKey, setPublicKey] = useState(publicKeyCache);
  const [privateKey, setPrivateKey] = useState(privateKeyCache);
  const [chipSettings, setChipSettings] = useState<ChipSettings>(initData);
  const [editingValues, setEditingValues] = useState<ChipSettings>(
    editValueCache ?? { ...initData, plScale: initPlScale, totalCapacity: initCapacity }
  );
  const [tabKey, setTabKey] = useState<string>('info');
  const handleSave = async () => {
    progressCaller.openNonstopProgress({ id: 'chip-settings', message: 'Saving Chip Data' });
    const res = await writeChipData(editingValues);
    progressCaller.popById('chip-settings');
    // deep copy
    editValueCache = JSON.parse(JSON.stringify(editingValues));
    if (res) onClose();
  };
  const tabItems = useMemo(
    () => [
      {
        key: 'info',
        label: 'Info',
        children: null,
      },
      {
        key: 'edit',
        label: 'Edit',
        children: null,
      },
    ],
    []
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
    if (!editValueCache)
      setEditingValues({ ...parsed, plScale: initPlScale, totalCapacity: initCapacity });
    progressCaller.popById('chip-settings');
  }, []);

  useEffect(
    () => () => {
      if (deviceMaster.currentDevice?.control?.getMode() === 'cartridge_io')
        deviceMaster.endCartridgeIOMode();
    },
    []
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
    []
  );

  const handleVerify = async () => {
    const res = await verifyChip(chipSettings.uid, privateKey, publicKey);
    if (res) fetchChipSettings();
  };

  const handleTabChange = (key: string) => {
    setTabKey(key);
  };
  const isEditing = tabKey === 'edit';
  const values = isEditing ? editingValues : chipSettings;

  return (
    <Modal
      open
      centered
      title="Catridge Chip Settings"
      maskClosable={false}
      okText="Save"
      onOk={handleSave}
      okButtonProps={{ disabled: !isEditing || !values.verified }}
      onCancel={onClose}
      width={600}
    >
      <Row gutter={[8, 8]}>
        {!values.verified && (
          <>
            <Col span={4}>Public Key</Col>
            <Col span={20}>
              <Input
                value={publicKey}
                onChange={(e) => {
                  const { value } = e.currentTarget;
                  setPublicKey(value);
                  publicKeyCache = value;
                }}
              />
            </Col>
            <Col span={4}>Private Key</Col>
            <Col span={20}>
              <Input
                value={privateKey}
                onChange={(e) => {
                  const { value } = e.currentTarget;
                  setPrivateKey(value);
                  privateKeyCache = value;
                }}
              />
            </Col>
          </>
        )}
        <Col span={20}>
          <Input value={values.uid} disabled />
        </Col>
        <Col span={4}>
          <Button type="primary" onClick={values.verified ? fetchChipSettings : handleVerify}>
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
                value={values.serial}
                disabled={!isEditing}
                onChange={(e) =>
                  setEditingValues({ ...editingValues, serial: e.currentTarget.value })
                }
              />
            </Col>
            <Col span={8}>Brand</Col>
            <Col span={16}>
              <Input
                value={values.brand}
                disabled={!isEditing}
                onChange={(e) =>
                  setEditingValues({ ...editingValues, brand: e.currentTarget.value })
                }
              />
            </Col>
            <Col span={8}>Type</Col>
            <Col span={16}>
              <Radio.Group
                value={values.type}
                optionType="button"
                buttonStyle="solid"
                disabled={!isEditing}
                onChange={(e) => setEditingValues({ ...editingValues, type: e.target.value })}
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
                value={values.color}
                options={colorSelectOptions}
                onChange={(value) => setEditingValues({ ...editingValues, color: value })}
              />
            </Col>
            <Col span={24}>Calibration</Col>
            <Col span={8}>
              <InputNumber
                addonBefore="X"
                value={values.offset?.[0] ?? 0}
                addonAfter="mm"
                precision={2}
                step={0.01}
                disabled={!isEditing}
                onChange={(val) =>
                  setEditingValues({
                    ...editingValues,
                    offset: [val, editingValues.offset[1], editingValues.offset[2]],
                  })
                }
              />
            </Col>
            <Col span={8}>
              <InputNumber
                addonBefore="Y"
                value={values.offset?.[1] ?? 0}
                addonAfter="mm"
                precision={2}
                step={0.01}
                disabled={!isEditing}
                onChange={(val) =>
                  setEditingValues({
                    ...editingValues,
                    offset: [editingValues.offset[0], val, editingValues.offset[2]],
                  })
                }
              />
            </Col>
            <Col span={8}>
              <InputNumber
                addonBefore="Z"
                value={values.offset?.[2] ?? 0}
                addonAfter="mm"
                precision={2}
                step={0.01}
                disabled={!isEditing}
                onChange={(val) =>
                  setEditingValues({
                    ...editingValues,
                    offset: [editingValues.offset[0], editingValues.offset[1], val],
                  })
                }
              />
            </Col>
            <Col span={8}>PL Scale</Col>
            <Col span={16}>
              <InputNumber
                disabled={!isEditing}
                value={values.plScale}
                onChange={(val) => setEditingValues({ ...editingValues, plScale: val })}
              />
            </Col>
            <Col span={8}>Total Capacity</Col>
            <Col span={16}>
              <InputNumber
                disabled={!isEditing}
                value={values.totalCapacity}
                onChange={(val) => setEditingValues({ ...editingValues, totalCapacity: val })}
              />
            </Col>
            <Col span={8}>Ink Storage</Col>
            <Col span={16}>
              <InputNumber disabled addonAfter="%" value={inkLevel * 100} precision={2} />
            </Col>
            <Col span={8}>Time Used</Col>
            <Col span={16}>
              <InputNumber disabled addonAfter="hr" value={values.timeUsed} />
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
