import React, { useMemo, useState } from 'react';

import { Form, Input, Modal, Typography } from 'antd';

import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { MY_MATERIALS_ID } from '@core/app/constants/material-catalog/constants';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useLayerStore } from '@core/app/stores/layer/layerStore';
import { useMaterialStore } from '@core/app/stores/materialStore';
import { generateUserId } from '@core/app/stores/materialStore/utils';
import layerManager from '@core/app/svgedit/layer/layerManager';
import Select from '@core/app/widgets/AntdSelect';
import { getConfigKeys, writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { getPresetModel } from '@core/helpers/presets/preset-helper';
import useI18n from '@core/helpers/useI18n';
import type { MaterialPreset, PresetValues } from '@core/interfaces/IMaterial';

import { findTargetMaterial, getMaterialTargetOptions, getVariantTargetOptions } from '../utils/materialTargetOptions';
import { getPresetDisplayParams } from '../utils/presetDisplayParams';

import styles from './AddPresetFromLayerModal.module.scss';

const NEW_MATERIAL = '__new__';

export interface AddPresetFromLayerModalProps {
  defaultMaterialId?: string;
  defaultVariantId?: string;
  onClose: () => void;
}

/** Snapshot of the active layer's live parameters for the current module */
const captureLayerValues = (module: LayerModuleType): PresetValues => {
  const state = useConfigPanelStore.getState().getState();
  const values: PresetValues = {};

  for (const key of getConfigKeys(module)) {
    const item = state[key];

    if (item && !item.hasMultiValue && item.value !== undefined) {
      (values as Record<string, unknown>)[key] = item.value;
    }
  }

  values.dpi = state.dpi.value;

  return values;
};

const AddPresetFromLayerModal = ({
  defaultMaterialId,
  defaultVariantId,
  onClose,
}: AddPresetFromLayerModalProps): React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  const tGlobal = useI18n().global;
  const module = useConfigPanelStore((state) => state.module.value);
  const workarea = useDocumentStore((state) => state.workarea);
  const { addMaterial, addPreset, ensureBucket, userMaterials, userVariants } = useMaterialStore();
  const [materialId, setMaterialId] = useState(defaultMaterialId ?? MY_MATERIALS_ID);
  // '' = whole material; otherwise a variant id of the chosen material
  const [variantId, setVariantId] = useState(defaultVariantId ?? '');
  const [newMaterialName, setNewMaterialName] = useState('');
  const [presetName, setPresetName] = useState('');

  const values = useMemo(() => captureLayerValues(module), [module]);
  const model = getPresetModel(workarea);

  const options = useMemo(
    () => [{ label: t.add_from_layer.create_new, value: NEW_MATERIAL }, ...getMaterialTargetOptions(userMaterials)],
    [userMaterials, t],
  );
  const targetMaterial = findTargetMaterial(materialId, userMaterials);
  const variantOptions = targetMaterial ? getVariantTargetOptions(targetMaterial, userVariants) : [];

  const handleSave = () => {
    if (!presetName.trim()) return;

    let targetId = materialId;

    if (materialId === NEW_MATERIAL) {
      if (!newMaterialName.trim()) return;

      targetId = generateUserId('user_mat');
      addMaterial({
        category: 'other',
        id: targetId,
        name: newMaterialName.trim(),
        presets: [],
        source: 'user',
      });
    } else if (materialId === MY_MATERIALS_ID) {
      ensureBucket();
    }

    const preset: MaterialPreset = {
      id: generateUserId(),
      name: presetName.trim(),
      origin: 'user',
      settings: { '*': { [`${module}`]: values } },
      ...(variantId && { variantId }),
    };

    addPreset(targetId, preset);

    // The layer chip now references the new preset (values already match the layer)
    useLayerStore.getState().selectedLayers.forEach((layerName) => {
      const layer = layerManager.getLayerElementByName(layerName);

      if (!layer) return;

      writeDataLayer(layer, 'configName', presetName.trim());
      writeDataLayer(layer, 'materialId', targetId);
      writeDataLayer(layer, 'presetId', preset.id);
    });
    useConfigPanelStore.getState().change({ configName: presetName.trim(), materialId: targetId, presetId: preset.id });

    onClose();
  };

  return (
    <Modal
      cancelText={tGlobal.cancel}
      okText={tGlobal.save}
      onCancel={onClose}
      onOk={handleSave}
      open
      title={t.add_from_layer.title}
      width={520}
    >
      <div className={styles.summary}>
        <Typography.Text className={styles.caption} strong>
          {t.add_from_layer.settings_from_layer}
        </Typography.Text>
        <div className={styles.pills}>
          {getPresetDisplayParams(values, { model, module }).map(({ label, value }) => (
            <span className={styles.pill} key={label}>
              <b>{label}</b>
              {value}
            </span>
          ))}
        </div>
      </div>
      <Form layout="vertical">
        <Form.Item label={t.add_from_layer.attach_to}>
          <Select
            onChange={(id) => {
              setMaterialId(id);
              setVariantId('');
            }}
            options={options}
            showSearch
            value={materialId}
          />
        </Form.Item>
        {variantOptions.length > 0 && (
          <Form.Item label={t.thickness}>
            <Select onChange={setVariantId} options={variantOptions} value={variantId} />
          </Form.Item>
        )}
        {materialId === NEW_MATERIAL && (
          <Form.Item label={t.add_from_layer.new_material_name} required>
            <Input onChange={(e) => setNewMaterialName(e.target.value)} value={newMaterialName} />
          </Form.Item>
        )}
        {materialId === MY_MATERIALS_ID && (
          <Typography.Text className={styles.hint} type="secondary">
            {t.add_from_layer.bucket_hint}
          </Typography.Text>
        )}
        <Form.Item label={t.add_from_layer.preset_name} required>
          <Input onChange={(e) => setPresetName(e.target.value)} value={presetName} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddPresetFromLayerModal;
