import React, { useMemo } from 'react';

import {
  ArrowLeftOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  PlusOutlined,
  ShoppingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Empty, Segmented, Space, Tag, Typography } from 'antd';
import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { useMaterialStore } from '@core/app/stores/materialStore';
import type { ResolvedPresetRow } from '@core/helpers/api/material-catalog/selectors';
import { getPresetsForContext, getVariants } from '@core/helpers/api/material-catalog/selectors';
import { getMaterialDisplayName, resolveLocalizedString } from '@core/helpers/api/material-catalog/utils';
import useI18n from '@core/helpers/useI18n';
import type { PresetModel } from '@core/interfaces/ILayerConfig';
import type { Material, MaterialRegion } from '@core/interfaces/IMaterial';

import styles from '../MaterialBrowser.module.scss';
import { useMaterialBrowserStore } from '../useMaterialBrowserStore';
import { getCoverStyle } from '../utils/coverStyle';
import { inchDisplay } from '../utils/inchDisplay';

import PresetRow from './PresetRow';

const { Paragraph, Text, Title } = Typography;

interface MaterialDetailProps {
  allMaterials: Material[];
  machineLabel: string;
  material: Material;
  model: PresetModel;
  module: LayerModuleType;
  onApply: (row: ResolvedPresetRow, material: Material) => void;
  onMovePreset: (row: ResolvedPresetRow) => void;
  region: MaterialRegion;
}

const MaterialDetail = ({
  allMaterials,
  machineLabel,
  material,
  model,
  module,
  onApply,
  onMovePreset,
  region,
}: MaterialDetailProps): React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  const { openDetail, openMaterialEditor, openPresetEditor, selectedVariantId, setSelectedVariantId } =
    useMaterialBrowserStore();
  const {
    deleteMaterial,
    deletePreset,
    disabledPresetIds,
    duplicateMaterial,
    presetOverrides,
    restorePreset,
    togglePresetDisabled,
    userPresets,
  } = useMaterialStore();

  const variants = useMemo(() => getVariants(material, allMaterials), [material, allMaterials]);
  const selectedVariant = variants.find(({ id }) => id === selectedVariantId) ?? variants[0];
  const displayMaterial = selectedVariant ?? material;
  const isUserMaterial = material.source === 'user';

  const rows = useMemo(() => {
    const userData = { disabledPresetIds, presetOverrides, userPresets };

    // Variant-specific rows first, thickness-agnostic parent rows appended
    return [
      ...getPresetsForContext(displayMaterial, model, module, userData),
      ...(selectedVariant ? getPresetsForContext(material, model, module, userData) : []),
    ];
  }, [displayMaterial, selectedVariant, material, model, module, disabledPresetIds, presetOverrides, userPresets]);

  const shopLink = region !== 'global' ? material.shopLinks?.[region] : undefined;
  const variantLabel = (variant: Material) =>
    region === 'us' ? inchDisplay(variant.thicknessInch) || `${variant.thicknessMm} mm` : `${variant.thicknessMm} mm`;

  const handleDeleteMaterial = () => {
    alertCaller.popUp({
      buttonType: alertConstants.CONFIRM_CANCEL,
      message: t.sure_to_delete_material,
      onConfirm: () => {
        deleteMaterial(material.id);
        openDetail(null);
      },
    });
  };

  const handleDeletePreset = (row: ResolvedPresetRow) => {
    alertCaller.popUp({
      buttonType: alertConstants.CONFIRM_CANCEL,
      message: t.sure_to_delete_preset,
      onConfirm: () => deletePreset(row.presetId),
    });
  };

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => openDetail(null)}
        style={{ marginBottom: 8, paddingLeft: 0 }}
        type="link"
      >
        {t.back_to_catalog}
      </Button>
      <div className={styles.detail}>
        <div className={styles.hero}>
          <div className={styles.cover} style={getCoverStyle(displayMaterial.image ? displayMaterial : material)} />
          {material.tags && material.tags.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Space size={[6, 6]} wrap>
                {material.tags.map((tag) => (
                  <Tag bordered={false} key={tag}>
                    {tag}
                  </Tag>
                ))}
              </Space>
            </div>
          )}
          {shopLink && (
            <Button
              block
              ghost
              href={shopLink}
              icon={<ShoppingOutlined />}
              rel="noreferrer"
              style={{ marginTop: 14 }}
              target="_blank"
              type="primary"
            >
              {t.buy_on_shop}
            </Button>
          )}
          {isUserMaterial && (
            <Space style={{ marginTop: 14 }}>
              <Button
                icon={<EditOutlined />}
                onClick={() => openMaterialEditor({ materialId: material.id, mode: 'edit' })}
              >
                {t.edit}
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={handleDeleteMaterial}>
                {t.delete}
              </Button>
            </Space>
          )}
          {!isUserMaterial && (
            <Space style={{ marginTop: 14 }}>
              <Button
                icon={<CopyOutlined />}
                onClick={() => {
                  const copy = duplicateMaterial(material, variants);

                  openDetail(copy.id);
                }}
              >
                {t.duplicate}
              </Button>
            </Space>
          )}
        </div>

        <div className={styles.content}>
          <Title level={4} style={{ marginBottom: 2, marginTop: 0 }}>
            {getMaterialDisplayName(material)}
          </Title>
          <Text style={{ textTransform: 'capitalize' }} type="secondary">
            {t.categories[material.category]}
          </Text>
          {material.description && (
            <Paragraph style={{ marginTop: 10 }}>{resolveLocalizedString(material.description)}</Paragraph>
          )}

          {variants.length > 0 && (
            <div style={{ margin: '14px 0' }}>
              <div className={styles['section-title']}>{t.thickness}</div>
              <div style={{ marginTop: 6 }}>
                <Segmented
                  onChange={(value) => setSelectedVariantId(value as string)}
                  options={variants.map((variant) => ({ label: variantLabel(variant), value: variant.id }))}
                  value={displayMaterial.id}
                />
              </div>
            </div>
          )}

          <div className={styles['preset-header']}>
            <div className={styles['section-title']}>{`${t.presets} — ${machineLabel}`}</div>
            <Dropdown
              menu={{
                items: [
                  { icon: <PlusOutlined />, key: 'manual', label: t.new_preset_manual },
                  { icon: <ThunderboltOutlined />, key: 'layer', label: t.from_current_layer },
                ],
                onClick: ({ key }) =>
                  openPresetEditor({
                    materialId: displayMaterial.id,
                    mode: 'add',
                    presetId: key === 'layer' ? 'from-layer' : undefined,
                  }),
              }}
              trigger={['click']}
            >
              <Button size="small" type="link">
                {t.add_preset} <DownOutlined />
              </Button>
            </Dropdown>
          </div>
          {rows.length > 0 ? (
            <div className={styles.presets}>
              {rows.map((row) => (
                <PresetRow
                  context={{ model, module }}
                  key={row.presetId}
                  onApply={(applied) => onApply(applied, displayMaterial)}
                  onDelete={handleDeletePreset}
                  onEdit={(edited) =>
                    openPresetEditor({ materialId: edited.materialId, mode: 'edit', presetId: edited.presetId })
                  }
                  onMove={onMovePreset}
                  onRestore={(restored) => restorePreset(restored.presetId)}
                  onToggleDisabled={(toggled) => togglePresetDisabled(toggled.presetId)}
                  row={row}
                />
              ))}
            </div>
          ) : (
            <Empty description={sprintf(t.no_presets_for_machine, machineLabel)} style={{ padding: '24px 0' }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialDetail;
