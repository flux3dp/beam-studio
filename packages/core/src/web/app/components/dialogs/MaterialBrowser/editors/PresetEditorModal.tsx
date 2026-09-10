import React, { useEffect, useState } from 'react';

import { Col, Form, Input, InputNumber, Modal, Row } from 'antd';

import { type LayerModuleType, printingModules } from '@core/app/constants/layer-module/layer-modules';
import { defaultEngraveDpiOptions, dpiValueMap, valueDpiMap } from '@core/app/constants/resolutions';
import type { EngraveDpiValue } from '@core/app/constants/resolutions';
import { useMaterialStore } from '@core/app/stores/materialStore';
import { generateUserId } from '@core/app/stores/materialStore/utils';
import Select from '@core/app/widgets/AntdSelect';
import type { ResolvedPresetRow } from '@core/helpers/api/material-catalog/selectors';
import useI18n from '@core/helpers/useI18n';
import type { PresetModel } from '@core/interfaces/ILayerConfig';
import type { Material, PresetValues } from '@core/interfaces/IMaterial';

import { useMaterialBrowserStore } from '../useMaterialBrowserStore';
import { getVariantTargetOptions } from '../utils/materialTargetOptions';

interface FormValues {
  dottingTime?: number;
  dpi?: EngraveDpiValue;
  fillInterval?: number;
  frequency?: number;
  ink?: number;
  multipass?: number;
  name: string;
  power?: number;
  pulseWidth?: number;
  repeat?: number;
  speed?: number;
}

interface PresetEditorModalProps {
  /** The row being edited (edit mode); undefined for a new manual preset */
  editingRow?: ResolvedPresetRow;
  /** The material the preset is created under (add mode); provides the variant options */
  material?: Material;
  model: PresetModel;
  module: LayerModuleType;
}

const PresetEditorModal = ({
  editingRow,
  material,
  model,
  module,
}: PresetEditorModalProps): null | React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  const tGlobal = useI18n().global;
  const laserPanelLang = useI18n().beambox.right_panel.laser_panel;
  const [form] = Form.useForm<FormValues>();
  const { closeEditors, presetEditor } = useMaterialBrowserStore();
  const { addPreset, updatePreset, userVariants } = useMaterialStore();
  // '' = whole material; otherwise a variant id
  const [variantTarget, setVariantTarget] = useState('');
  const variantOptions = material ? getVariantTargetOptions(material, userVariants) : [];

  const isPrinting = printingModules.has(module);
  const isPromark = model.startsWith('fpm1_');
  const isMopa = model.startsWith('fpm1_1');
  const isEdit = presetEditor.mode === 'edit';

  useEffect(() => {
    if (!presetEditor.open) return;

    setVariantTarget(presetEditor.variantId ?? '');

    if (isEdit && editingRow) {
      const { values } = editingRow;

      form.setFieldsValue({
        dottingTime: values.dottingTime,
        dpi: values.dpi ? dpiValueMap[values.dpi] : undefined,
        fillInterval: values.fillInterval,
        frequency: values.frequency,
        ink: values.ink,
        multipass: values.multipass,
        name: editingRow.displayName,
        power: values.power,
        pulseWidth: values.pulseWidth,
        repeat: values.repeat,
        speed: values.speed,
      });
    } else {
      form.resetFields();
      form.setFieldsValue(
        isPrinting
          ? { ink: 3, multipass: 3, name: '', repeat: 1 }
          : { dpi: 250, name: '', power: 50, repeat: 1, speed: 10 },
      );
    }
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [presetEditor.open]);

  if (!presetEditor.open) return null;

  const handleOk = async () => {
    const { dpi, name, ...raw } = await form.validateFields();
    const values: PresetValues & { name?: string } = Object.fromEntries(
      Object.entries(raw).filter(([, value]) => value !== undefined && value !== null),
    );

    if (dpi !== undefined && !isPrinting) values.dpi = valueDpiMap[dpi];

    if (isEdit && editingRow) {
      // User presets write back to the cell this context resolves from; defaults
      // become [Customized] overlays at the context cell.
      updatePreset(editingRow.presetId, model, `${module}`, { ...values, name });
    } else if (presetEditor.materialId) {
      addPreset(presetEditor.materialId, {
        id: generateUserId(),
        name,
        origin: 'user',
        settings: { '*': { [`${module}`]: values } },
        ...(variantTarget && { variantId: variantTarget }),
      });
    }

    closeEditors();
  };

  return (
    <Modal
      cancelText={tGlobal.cancel}
      okText={isEdit ? t.preset_editor.title_edit : t.preset_editor.title_new}
      onCancel={closeEditors}
      onOk={handleOk}
      open
      title={isEdit ? t.preset_editor.title_edit : t.preset_editor.title_new}
      width={480}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={t.preset_editor.name}
          name="name"
          rules={[{ message: t.preset_editor.name_required, required: true }]}
        >
          <Input />
        </Form.Item>
        {!isEdit && variantOptions.length > 0 && (
          <Form.Item label={t.add_from_layer.attach_to}>
            <Select onChange={setVariantTarget} options={variantOptions} value={variantTarget} />
          </Form.Item>
        )}
        <Row gutter={12}>
          {isPrinting ? (
            <>
              <Col span={8}>
                <Form.Item label={laserPanelLang.ink_saturation} name="ink">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={laserPanelLang.print_multipass} name="multipass">
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={laserPanelLang.repeat} name="repeat">
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </>
          ) : (
            <>
              <Col span={8}>
                <Form.Item label={laserPanelLang.strength} name="power">
                  <InputNumber max={100} min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={laserPanelLang.speed} name="speed">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={laserPanelLang.repeat} name="repeat">
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              {isPromark ? (
                <>
                  {isMopa ? (
                    <Col span={8}>
                      <Form.Item label={laserPanelLang.pulse_width} name="pulseWidth">
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  ) : (
                    <>
                      <Col span={8}>
                        <Form.Item label={laserPanelLang.dottingTime} name="dottingTime">
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label={laserPanelLang.fill_interval} name="fillInterval">
                          <InputNumber min={0.0001} step={0.001} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </>
                  )}
                  <Col span={8}>
                    <Form.Item label={laserPanelLang.frequency} name="frequency">
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </>
              ) : (
                <Col span={8}>
                  <Form.Item label="DPI" name="dpi">
                    <Select
                      options={defaultEngraveDpiOptions.map((option) => ({
                        label: `${dpiValueMap[option]} DPI`,
                        value: dpiValueMap[option],
                      }))}
                    />
                  </Form.Item>
                </Col>
              )}
            </>
          )}
        </Row>
      </Form>
    </Modal>
  );
};

export default PresetEditorModal;
