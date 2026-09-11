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
import { getPresetsForContext, getVisibleVariants } from '@core/helpers/api/material-catalog/selectors';
import { getThicknessLabel } from '@core/helpers/api/material-catalog/thickness';
import { getMaterialDisplayName, resolveLocalizedString } from '@core/helpers/api/material-catalog/utils';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import type { PresetModel } from '@core/interfaces/ILayerConfig';
import type { Material, MaterialRegion, MaterialVariant } from '@core/interfaces/IMaterial';

import { showAddPresetFromLayer, showMaterialEditorModal } from '../editors';
import AddVariantModal from '../editors/AddVariantModal';
import { useMaterialBrowserStore } from '../useMaterialBrowserStore';
import { getCoverStyle } from '../utils/coverStyle';

import styles from './MaterialDetail.module.scss';
import PresetRow from './PresetRow';

const { Paragraph, Text, Title } = Typography;

interface MaterialDetailProps {
  machineLabel: string;
  material: Material;
  model: PresetModel;
  module: LayerModuleType;
  region: MaterialRegion;
}

const MaterialDetail = ({ machineLabel, material, model, module, region }: MaterialDetailProps): React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  const { openDetail, openPresetEditor, selectedVariantId, setSelectedVariantId } = useMaterialBrowserStore();
  const materialStore = useMaterialStore();
  const {
    deleteMaterial,
    deleteVariant,
    disabledPresetIds,
    duplicateMaterial,
    pinnedVariantIds,
    presetOverrides,
    userPresets,
    userVariants,
  } = materialStore;

  const variants = useMemo(
    () => getVisibleVariants(material, model, module, materialStore),
    [material, model, module, materialStore],
  );
  const selectedVariant = variants.find(({ id }) => id === selectedVariantId) ?? variants[0];
  const isUserMaterial = material.source === 'user';
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
  // User content only: user-added variants, and pinned catalog variants while the pin is the sole
  // reason they are listed — once a built-in preset resolves for this device, unpinning changes nothing
  const isDeletableVariant =
    !!selectedVariant &&
    (userVariants.some(({ id }) => id === selectedVariant.id) ||
      (pinnedVariantIds.includes(selectedVariant.id) &&
        !rows.some(({ preset }) => preset.origin === 'default' && preset.variantId === selectedVariant.id)));

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

  return (
    <div>
      <Button className={styles.back} icon={<ArrowLeftOutlined />} onClick={() => openDetail(null)} type="link">
        {t.back_to_catalog}
      </Button>
      <div className={styles.detail}>
        <div className={styles.hero}>
          <div
            className={styles.cover}
            style={getCoverStyle(selectedVariant?.image ? { ...material, image: selectedVariant.image } : material)}
          />
          {material.tags && material.tags.length > 0 && (
            <div className={styles.tags}>
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
              className={styles.shop}
              ghost
              icon={<ShoppingOutlined />}
              onClick={() => browser.open(shopLink)}
              type="primary"
            >
              {t.buy_on_shop}
            </Button>
          )}
          <Space className={styles.actions}>
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
          <Title className={styles.title} level={4}>
            {getMaterialDisplayName(material)}
          </Title>
          <Text className={styles.category} type="secondary">
            {t.categories[material.category]}
          </Text>
          {material.description && (
            <Paragraph className={styles.description}>{resolveLocalizedString(material.description)}</Paragraph>
          )}

          <div className={styles.thickness}>
            <div className={styles['section-title']}>{t.thickness}</div>
            <div className={styles['variant-row']}>
              {variants.length > 0 && (
                <div className={styles['variant-scroll']}>
                  <Segmented
                    onChange={(value) => setSelectedVariantId(value as string)}
                    options={variants.map((variant) => ({ label: variantLabel(variant), value: variant.id }))}
                    value={selectedVariant?.id}
                  />
                </div>
              )}
              {/* User variants attach to ANY material (catalog included); a thickness matching a hidden catalog variant re-adds (pins) it */}
              <Button
                icon={<PlusOutlined />}
                onClick={() => setAddingVariant(true)}
                size="small"
                title={t.thickness}
                type="text"
              />
              {isDeletableVariant && (
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
                  key === 'layer'
                    ? showAddPresetFromLayer({ defaultMaterialId: material.id, defaultVariantId: selectedVariant?.id })
                    : openPresetEditor({ materialId: material.id, mode: 'add', variantId: selectedVariant?.id }),
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
                <PresetRow context={{ model, module }} key={row.presetId} row={row} />
              ))}
            </div>
          ) : (
            <Empty className={styles.empty} description={sprintf(t.no_presets_for_machine, machineLabel)} />
          )}
        </div>
      </div>
      {addingVariant && (
        <AddVariantModal
          material={material}
          onClose={() => setAddingVariant(false)}
          region={region}
          visibleVariants={variants}
        />
      )}
    </div>
  );
};

export default MaterialDetail;
