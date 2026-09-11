import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { MY_MATERIALS_ID } from '@core/app/constants/material-catalog/constants';
import { materialCatalogCache } from '@core/helpers/api/material-catalog/materialCatalogCache';
import type { VariantUserData } from '@core/helpers/api/material-catalog/selectors';
import { getVisibleVariants } from '@core/helpers/api/material-catalog/selectors';
import { getThicknessLabel } from '@core/helpers/api/material-catalog/thickness';
import { getMaterialDisplayName } from '@core/helpers/api/material-catalog/utils';
import i18n from '@core/helpers/i18n';
import type { PresetModel } from '@core/interfaces/ILayerConfig';
import type { Material } from '@core/interfaces/IMaterial';

/** Select options for "which material owns this preset": My Materials, user materials, then the catalog */
export const getMaterialTargetOptions = (userMaterials: Material[]): Array<{ label: string; value: string }> => {
  const toOption = (material: Material) => ({ label: getMaterialDisplayName(material), value: material.id });

  return [
    { label: i18n.lang.beambox.material_browser.catalog.materials.my_materials, value: MY_MATERIALS_ID },
    ...userMaterials.filter(({ id }) => id !== MY_MATERIALS_ID).map(toOption),
    ...materialCatalogCache.getCatalogSync().materials.map(toOption),
  ];
};

/** The material behind a target-option value: user materials first, then the catalog */
export const findTargetMaterial = (materialId: string, userMaterials: Material[]): Material | undefined =>
  userMaterials.find(({ id }) => id === materialId) ??
  materialCatalogCache.getCatalogSync().materials.find(({ id }) => id === materialId);

/**
 * Scope options under a chosen material: the whole material (value '', labeled '-') or one
 * thickness variant visible for this machine. Empty when there is none.
 */
export const getVariantTargetOptions = (
  material: Material,
  model: PresetModel,
  module: LayerModuleType,
  userData: VariantUserData,
): Array<{ label: string; value: string }> => {
  const variants = getVisibleVariants(material, model, module, userData);

  if (variants.length === 0) return [];

  return [
    { label: '-', value: '' },
    ...variants.map((variant) => ({ label: getThicknessLabel(variant) ?? variant.id, value: variant.id })),
  ];
};
