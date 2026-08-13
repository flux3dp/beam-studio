import React, { useMemo, useState } from 'react';

import { Form, Input, Modal, Space, Typography } from 'antd';

import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { MY_MATERIALS_ID } from '@core/app/constants/material-catalog/constants';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { useDocumentStore } from '@core/app/stores/documentStore';
import useLayerStore from '@core/app/stores/layer/layerStore';
import { useMaterialStore } from '@core/app/stores/materialStore';
import { generateUserId } from '@core/app/stores/materialStore/utils';
import layerManager from '@core/app/svgedit/layer/layerManager';
import Select from '@core/app/widgets/AntdSelect';
import { materialCatalogCache } from '@core/helpers/api/material-catalog/materialCatalogCache';
import { getMaterialDisplayName } from '@core/helpers/api/material-catalog/utils';
import { getConfigKeys, writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { getPresetModel } from '@core/helpers/presets/preset-helper';
import useI18n from '@core/helpers/useI18n';
import type { Material, MaterialPreset, PresetValues } from '@core/interfaces/IMaterial';

import styles from '../MaterialBrowser.module.scss';
import { getPresetDisplayParams } from '../utils/presetDisplayParams';

const NEW_MATERIAL = '__new__';

export interface AddPresetFromLayerModalProps {
  defaultMaterialId?: string;
  onClose: () => void;
  onSaved?: (materialId: string, presetId: string) => void;
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
  onClose,
  onSaved,
}: AddPresetFromLayerModalProps): React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  const module = useConfigPanelStore((state) => state.module.value);
  const workarea = useDocumentStore((state) => state.workarea);
  const { addMaterial, addPreset, ensureBucket, userMaterials } = useMaterialStore();
  const [materialId, setMaterialId] = useState(defaultMaterialId ?? MY_MATERIALS_ID);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [presetName, setPresetName] = useState('');

  const values = useMemo(() => captureLayerValues(module), [module]);
  const model = getPresetModel(workarea);

  const options = useMemo(() => {
    const catalogMaterials = materialCatalogCache.getCatalogSync().materials;
    const toOption = (material: Material) => ({ label: getMaterialDisplayName(material), value: material.id });

    return [
      { label: t.add_from_layer.create_new, value: NEW_MATERIAL },
      { label: t.catalog.materials.my_materials, value: MY_MATERIALS_ID },
      ...userMaterials.filter(({ id }) => id !== MY_MATERIALS_ID).map(toOption),
      ...catalogMaterials.map(toOption),
    ];
  }, [userMaterials, t]);

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

    onSaved?.(targetId, preset.id);
    onClose();
  };

  return (
    <Modal
      okText={t.add_from_layer.title}
      onCancel={onClose}
      onOk={handleSave}
      open
      title={t.add_from_layer.title}
      width={520}
    >
      <div style={{ background: '#f6f8fa', borderRadius: 8, marginBottom: 16, padding: '10px 12px' }}>
        <Typography.Text strong style={{ color: '#888', fontSize: 12 }}>
          {t.add_from_layer.settings_from_layer}
        </Typography.Text>
        <div style={{ marginTop: 6 }}>
          <Space size={[6, 6]} wrap>
            {getPresetDisplayParams(values, { model, module }).map(({ label, value }) => (
              <span className={styles.pill} key={label}>
                <b>{label}</b>
                {value}
              </span>
            ))}
          </Space>
        </div>
      </div>
      <Form layout="vertical">
        <Form.Item label={t.add_from_layer.attach_to}>
          <Select onChange={setMaterialId} options={options} showSearch value={materialId} />
        </Form.Item>
        {materialId === NEW_MATERIAL && (
          <Form.Item label={t.add_from_layer.new_material_name} required>
            <Input onChange={(e) => setNewMaterialName(e.target.value)} value={newMaterialName} />
          </Form.Item>
        )}
        {materialId === MY_MATERIALS_ID && (
          <Typography.Text style={{ display: 'block', marginBottom: 12 }} type="secondary">
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
