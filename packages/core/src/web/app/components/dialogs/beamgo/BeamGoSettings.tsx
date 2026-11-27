import React, { useEffect, useState } from 'react';

import { Alert, Button, Descriptions, Flex, Form, InputNumber, Modal, Select, Spin, Switch } from 'antd';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import checkDeviceStatus from '@core/helpers/check-device-status';
import { beamGoAction } from '@core/helpers/device/beamgo/api';
import type { BeamGoCalibration, BeamGoSafety, CalibrationWrite } from '@core/helpers/device/beamgo/api';
import { getBeamGoWatt, setBeamGoWatt } from '@core/helpers/device/beamgo/settings';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const pairs = [
  ['scaleX', 'scaleY'],
  ['bucketX', 'bucketY'],
  ['paralleX', 'paralleY'],
  ['trapeX', 'trapeY'],
] as const;

interface Props {
  calibration?: boolean;
  device: IDeviceInfo;
  onClose: () => void;
}

const BeamGoSettings = ({ calibration = false, device, onClose }: Props): React.JSX.Element => {
  const lang = useI18n();
  const { beamgo: t, promark_settings: p } = lang;
  const [form] = Form.useForm<BeamGoCalibration & BeamGoSafety>();
  const [busy, setBusy] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [backup, setBackup] = useState<CalibrationWrite>();
  const [info, setInfo] = useState(device);
  const [watt, setWatt] = useState<10 | 20>(() => getBeamGoWatt(device.serial));

  useEffect(() => {
    let disposed = false;
    const load = async () => {
      try {
        const result = await beamGoAction<BeamGoCalibration & BeamGoSafety>(
          device,
          calibration ? 'getCalibration' : 'getSafetySettings',
        );

        if (!result.success) throw new Error(result.error);

        const identity = await beamGoAction<IDeviceInfo>(device, 'getDeviceInfo');

        if (!identity.success) throw new Error(identity.error);

        if (disposed) return;

        form.setFieldsValue(result);
        setInfo({ ...device, ...identity });
        setLoaded(true);
      } catch (cause) {
        if (!disposed) setError(String(cause));
      } finally {
        if (!disposed) setBusy(false);
      }
    };

    void load();

    return () => {
      disposed = true;
    };
  }, [device, calibration, form]);

  const save = async (restore = false) => {
    try {
      const values = restore ? undefined : await form.validateFields();

      setBusy(true);
      setError('');

      const action = restore ? 'restoreCalibration' : calibration ? 'setCalibration' : 'setSafetySettings';
      const result = await beamGoAction<BeamGoSafety & CalibrationWrite>(
        device,
        action,
        restore ? { lens: backup?.backupLens, rawHex: backup?.backupHex } : values,
      );

      // Keep the first backup even after a failed restore; it is the known pre-edit state.
      if (!restore && result.backupHex) setBackup(result);

      if (!result.success) throw new Error(calibration ? `${t.readback_error} (${result.error})` : result.error);

      form.setFieldsValue(calibration ? result.readback! : result);

      if (!calibration) setBeamGoWatt(device.serial, watt);
    } catch (cause) {
      setError(String(cause));
    } finally {
      setBusy(false);
    }
  };

  const labels = [p.scale, p.bulge, p.skew, p.trapezoid];

  return (
    <Modal
      closable={!busy}
      footer={
        <Flex gap={8} justify="end">
          {backup?.backupHex && (
            <Button disabled={busy} onClick={() => save(true)}>
              {t.restore}
            </Button>
          )}
          <Button disabled={busy} onClick={onClose}>
            {lang.alert.close}
          </Button>
          <Button disabled={!loaded} loading={busy} onClick={() => save()} type="primary">
            {lang.alert.save}
          </Button>
        </Flex>
      }
      maskClosable={false}
      onCancel={onClose}
      open
      title={calibration ? t.calibration : t.settings}
    >
      <Spin spinning={busy}>
        <Flex gap={16} vertical>
          {error && <Alert message={error} showIcon type="error" />}
          {!calibration && (
            <Descriptions
              column={1}
              items={[
                { children: 'BeamGo', key: 'model', label: lang.device.model_name },
                { children: info.name, key: 'name', label: lang.topbar.menu.machine_info },
                { children: info.serial, key: 'serial', label: lang.device.serial_number },
                { children: info.version, key: 'version', label: lang.device.firmware_version },
              ]}
            />
          )}
          {calibration && <Alert message={t.field_warning} showIcon type="info" />}
          <Form
            disabled={busy || !loaded}
            form={form}
            layout="vertical"
            onValuesChange={(changed) => {
              if (changed.swapXY !== undefined) {
                const current = form.getFieldsValue();
                const next: Partial<BeamGoCalibration> = {};

                pairs.forEach(([x, y]) => {
                  next[x] = current[y];
                  next[y] = current[x];
                });
                form.setFieldsValue(next);
              }
            }}
          >
            {calibration ? (
              <>
                <Form.Item
                  label={lang.beambox.document_panel.workarea}
                  name="fieldMm"
                  rules={[{ max: 600, min: 10, required: true, type: 'integer' }]}
                >
                  <InputNumber addonAfter="mm" max={600} min={10} precision={0} />
                </Form.Item>
                {(['swapXY', 'reverseX', 'reverseY'] as const).map((key, index) => (
                  <Form.Item
                    key={key}
                    label={[t.swap_xy, t.reverse_x, t.reverse_y][index]}
                    name={key}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                ))}
                {pairs.map((pair, index) => (
                  <Flex gap={16} key={pair[0]}>
                    {pair.map((key, axis) => (
                      <Form.Item
                        key={key}
                        label={`${labels[index]} ${axis ? 'Y' : 'X'}`}
                        name={key}
                        rules={[{ max: index ? 1.5 : 1, min: index ? 0.5 : 0.1, required: true, type: 'number' }]}
                      >
                        <InputNumber max={index ? 1.5 : 1} min={index ? 0.5 : 0.1} precision={4} step={0.0001} />
                      </Form.Item>
                    ))}
                  </Flex>
                ))}
              </>
            ) : (
              <>
                <Form.Item label={t.door_check} name="doorCheck" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item label={t.tilt_check} name="tiltCheck" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item label={t.watt}>
                  <Select
                    onChange={setWatt}
                    options={[
                      { label: '10 W', value: 10 },
                      { label: '20 W', value: 20 },
                    ]}
                    value={watt}
                  />
                </Form.Item>
              </>
            )}
          </Form>
        </Flex>
      </Spin>
    </Modal>
  );
};

export const showBeamGoSettings = async (device: IDeviceInfo, calibration = false): Promise<void> => {
  const result = await deviceMaster.select(device);

  if (!result.success || !(await checkDeviceStatus(device))) return;

  const id = 'beamgo-settings';

  if (!isIdExist(id)) {
    addDialogComponent(
      id,
      <BeamGoSettings calibration={calibration} device={device} onClose={() => popDialogById(id)} />,
    );
  }
};

export default BeamGoSettings;
