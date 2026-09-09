import React, { useMemo, useState } from 'react';

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
import dialogCaller from '@core/app/actions/dialog-caller';
import alertConstants from '@core/app/constants/alert-constants';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { useMaterialStore } from '@core/app/stores/materialStore';
import type { ResolvedPresetRow } from '@core/helpers/api/material-catalog/selectors';
import { getPresetsForContext, getSortedVariants } from '@core/helpers/api/material-catalog/selectors';
import { getMaterialDisplayName, resolveLocalizedString } from '@core/helpers/api/material-catalog/utils';
import useI18n from '@core/helpers/useI18n';
import type { PresetModel } from '@core/interfaces/ILayerConfig';
import type { Material, MaterialRegion, MaterialVariant } from '@core/interfaces/IMaterial';

import { showMaterialEditorModal } from '../editors';
import AddVariantModal from '../editors/AddVariantModal';
import styles from '../MaterialBrowser.module.scss';
import { useMaterialBrowserStore } from '../useMaterialBrowserStore';
import { getCoverStyle } from '../utils/coverStyle';
import { getThicknessLabel } from '../utils/inchDisplay';

import PresetRow from './PresetRow';

const { Paragraph, Text, Title } = Typography;

interface MaterialDetailProps {
  machineLabel: string;
  material: Material;
  model: PresetModel;
  module: LayerModuleType;
  onApply: (row: ResolvedPresetRow, material: Material) => void;
  onMovePreset: (row: ResolvedPresetRow) => void;
  region: MaterialRegion;
}

const MaterialDetail = ({
  machineLabel,
  material,
  model,
  module,
  onApply,
  onMovePreset,
  region,
}: MaterialDetailProps): React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  const { openDetail, openPresetEditor, selectedVariantId, setSelectedVariantId } = useMaterialBrowserStore();
  const {
    deleteMaterial,
    deletePreset,
    deleteVariant,
    disabledPresetIds,
    duplicateMaterial,
    presetOverrides,
    restorePreset,
    togglePresetDisabled,
    userPresets,
    userVariants,
  } = useMaterialStore();

  const variants = useMemo(() => getSortedVariants(material, userVariants), [material, userVariants]);
  const selectedVariant = variants.find(({ id }) => id === selectedVariantId) ?? variants[0];
  const isUserMaterial = material.source === 'user';
  // Only user-added variants are deletable (catalog ones aren't user content)
  const isUserVariant = !!selectedVariant && userVariants.some(({ id }) => id === selectedVariant.id);
  const [addingVariant, setAddingVariant] = useState(false);

  // Variant-scoped presets filtered to the selected variant; material-wide presets always show
  const rows = useMemo(
    () =>
      getPresetsForContext(
        material,
        model,
        module,
        { disabledPresetIds, presetOverrides, userPresets },
        selectedVariant?.id,
      ),
    [material, model, module, disabledPresetIds, presetOverrides, userPresets, selectedVariant],
  );

  const shopLink = region !== 'global' ? material.shopLinks?.[region] : undefined;
  const variantLabel = (variant: MaterialVariant) => getThicknessLabel(variant) ?? '—';

  const handleDuplicate = async () => {
    const name = await dialogCaller.getPromptValue({
      caption: t.editor.name,
      defaultValue: getMaterialDisplayName(material),
    });

    // null = cancelled; empty input falls back to the source display name
    if (name === null) return;

    const copy = duplicateMaterial(material, name.trim());

    openDetail(copy.id);
  };

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

  const handleDeleteVariant = () => {
    if (!selectedVariant) return;

    alertCaller.popUp({
      buttonType: alertConstants.CONFIRM_CANCEL,
      message: t.sure_to_delete_variant,
      onConfirm: () => {
        deleteVariant(selectedVariant.id);
        setSelectedVariantId(null);
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
          <div
            className={styles.cover}
            style={getCoverStyle(selectedVariant?.image ? { ...material, image: selectedVariant.image } : material)}
          />
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
          <Space style={{ marginTop: 14 }}>
            {isUserMaterial && (
              <Button icon={<EditOutlined />} onClick={() => showMaterialEditorModal({ materialId: material.id })}>
                {t.edit}
              </Button>
            )}
            <Button icon={<CopyOutlined />} onClick={handleDuplicate}>
              {t.duplicate}
            </Button>
            {isUserMaterial && (
              <Button danger icon={<DeleteOutlined />} onClick={handleDeleteMaterial}>
                {t.delete}
              </Button>
            )}
          </Space>
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

          <div style={{ margin: '14px 0' }}>
            <div className={styles['section-title']}>{t.thickness}</div>
            <div style={{ alignItems: 'center', display: 'flex', gap: 8, marginTop: 6 }}>
              {variants.length > 0 && (
                <div className={styles['variant-scroll']}>
                  <Segmented
                    onChange={(value) => setSelectedVariantId(value as string)}
                    options={variants.map((variant) => ({ label: variantLabel(variant), value: variant.id }))}
                    value={selectedVariant?.id}
                  />
                </div>
              )}
              {/* User variants attach to ANY material (catalog included); only they are deletable */}
              <Button
                icon={<PlusOutlined />}
                onClick={() => setAddingVariant(true)}
                size="small"
                title={t.thickness}
                type="text"
              />
              {isUserVariant && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDeleteVariant}
                  size="small"
                  title={t.delete}
                  type="text"
                />
              )}
            </div>
          </div>

          <div className={styles['preset-header']}>
            <div className={styles['section-title']}>{`${t.presets} — ${machineLabel}`}</div>
            <Dropdown
              menu={{
                items: [
                  { icon: <PlusOutlined />, key: 'manual', label: t.new_preset_manual },
                  { icon: <ThunderboltOutlined />, key: 'layer', label: t.from_current_layer },
                ],
                onClick: ({ key }) =>
                  // Defaults to the selected variant; the editor lets the user retarget
                  // (a specific variant or the whole material)
                  openPresetEditor({
                    materialId: material.id,
                    mode: 'add',
                    presetId: key === 'layer' ? 'from-layer' : undefined,
                    variantId: selectedVariant?.id,
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
                  onApply={(applied) => onApply(applied, material)}
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
      {addingVariant && <AddVariantModal material={material} onClose={() => setAddingVariant(false)} region={region} />}
    </div>
  );
};

export default MaterialDetail;
