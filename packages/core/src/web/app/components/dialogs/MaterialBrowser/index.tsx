import React, { useEffect, useMemo, useState } from 'react';

import { Drawer, Tag, Typography } from 'antd';

import initState from '@core/app/components/beambox/RightPanel/ConfigPanel/initState';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useLayerStore } from '@core/app/stores/layer/layerStore';
import { useMaterialStore } from '@core/app/stores/materialStore';
import { useIsMobile } from '@core/app/stores/screenStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import DraggableModal from '@core/app/widgets/DraggableModal';
import {
  materialCatalogCache,
  materialCatalogEventEmitter,
} from '@core/helpers/api/material-catalog/materialCatalogCache';
import type { ResolvedPresetRow } from '@core/helpers/api/material-catalog/selectors';
import {
  getPresetsForContext,
  getVisibleMaterials,
  searchMaterials,
} from '@core/helpers/api/material-catalog/selectors';
import { getMaterialRegion } from '@core/helpers/api/material-catalog/utils';
import { getConfigKeys } from '@core/helpers/layer/layer-config-helper';
import { applyMaterialPreset, toLegacyPreset } from '@core/helpers/materials/material-apply';
import { exportMaterialLibrary, importMaterialLibrary } from '@core/helpers/materials/material-import-export';
import { getPresetModel } from '@core/helpers/presets/preset-helper';
import useI18n from '@core/helpers/useI18n';
import type { Material, MaterialCatalog } from '@core/interfaces/IMaterial';

import CatalogGrid from './CatalogGrid';
import CategoryTabs from './CategoryTabs';
import ControlBar from './ControlBar';
import { showAddPresetFromLayer } from './editors';
import MovePresetModal from './editors/MovePresetModal';
import PresetEditorModal from './editors/PresetEditorModal';
import styles from './MaterialBrowser.module.scss';
import MaterialDetail from './MaterialDetail';
import { useMaterialBrowserStore } from './useMaterialBrowserStore';

interface MaterialBrowserProps {
  onClose: () => void;
}

const MaterialBrowser = ({ onClose }: MaterialBrowserProps): React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  const isMobile = useIsMobile();
  const workarea = useDocumentStore((state) => state.workarea);

  // HEXA RF watt affects getPresetModel — re-filter while the browser is open
  useCanvasStore((state) => state.watt);

  const { activeTab, detailMaterialId, module, presetEditor, query, reset, writeLayers } = useMaterialBrowserStore();
  const { disabledPresetIds, favorites, presetOverrides, recents, userMaterials, userPresets } = useMaterialStore();

  const [catalog, setCatalog] = useState<MaterialCatalog>(() => materialCatalogCache.getCatalogSync());
  const [movePresetId, setMovePresetId] = useState<null | string>(null);

  useEffect(() => {
    materialCatalogCache.getCatalog().then(setCatalog);

    const onUpdated = (updated: MaterialCatalog) => setCatalog(updated);

    materialCatalogEventEmitter.on('updated', onUpdated);

    return () => {
      materialCatalogEventEmitter.removeListener('updated', onUpdated);
    };
  }, []);

  const region = getMaterialRegion();
  const model = getPresetModel(workarea);
  const machineLabel = getWorkarea(workarea).label;

  // Display order: catalog first, user content appended (contract §2.1)
  const allMaterials = useMemo(() => [...catalog.materials, ...userMaterials], [catalog, userMaterials]);
  // Catalog materials with no preset resolvable in the current machine context are hidden;
  // the user's own materials always show
  const visibleMaterials = useMemo(() => {
    const userData = { disabledPresetIds, presetOverrides, userPresets };

    return getVisibleMaterials(allMaterials, region).filter(
      (material) => material.source === 'user' || getPresetsForContext(material, model, module, userData).length > 0,
    );
  }, [allMaterials, region, model, module, disabledPresetIds, presetOverrides, userPresets]);
  const searching = query.trim() !== '';
  const searchResults = useMemo(
    () => (searching ? searchMaterials(visibleMaterials, query) : []),
    [searching, visibleMaterials, query],
  );

  const gridMaterials = useMemo(() => {
    if (searching) return searchResults;

    if (activeTab === 'favorites') return visibleMaterials.filter(({ id }) => favorites.includes(id));

    if (activeTab === 'recents') {
      const seen = new Set<string>();
      const ordered: Material[] = [];

      for (const { materialId } of recents) {
        const material = allMaterials.find(({ id }) => id === materialId);

        if (material && !seen.has(material.id) && visibleMaterials.includes(material)) {
          seen.add(material.id);
          ordered.push(material);
        }
      }

      return ordered;
    }

    return visibleMaterials.filter(({ category }) => category === activeTab);
  }, [searching, searchResults, activeTab, visibleMaterials, favorites, recents, allMaterials]);

  const detailMaterial = detailMaterialId ? allMaterials.find(({ id }) => id === detailMaterialId) : undefined;
  const editingRow = useMemo((): ResolvedPresetRow | undefined => {
    if (!presetEditor.open || presetEditor.mode !== 'edit' || !presetEditor.presetId) return undefined;

    // Rebuild the row being edited: rows carry their owning material's id
    const material = allMaterials.find(({ id }) => id === presetEditor.materialId);

    if (!material) return undefined;

    return getPresetsForContext(material, model, module, {
      disabledPresetIds,
      presetOverrides,
      userPresets,
    }).find((row) => row.presetId === presetEditor.presetId);
  }, [presetEditor, allMaterials, model, module, disabledPresetIds, presetOverrides, userPresets]);

  const handleApply = (row: ResolvedPresetRow, material: Material) => {
    if (writeLayers) {
      const batchCmd = new history.BatchCommand('Change layer preset');
      const layers = useLayerStore
        .getState()
        .selectedLayers.map((layerName) => layerManager.getLayerElementByName(layerName))
        .filter(Boolean) as Element[];

      applyMaterialPreset(material, row.preset, { batchCmd, layers });
      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
      initState();
    } else {
      // Mobile modal variant: stage values in the config store only. Entries declaring a
      // dpi apply at it, others keep the layer's current dpi.
      const legacy = toLegacyPreset(row.preset, row.values, module);
      const payload: Record<string, unknown> = {
        configName: legacy.isDefault ? legacy.key : legacy.name,
        materialId: material.id,
        presetId: row.presetId,
      };

      for (const key of getConfigKeys(module)) {
        if (legacy[key] !== undefined) payload[key] = legacy[key];
      }

      if (row.values.dpi) payload.dpi = row.values.dpi;

      useConfigPanelStore.getState().change(payload as never);
      useMaterialStore.getState().pushRecent(material.id, row.presetId);
    }

    onClose();
  };

  const body = (
    <div className={styles.body}>
      {detailMaterial ? (
        <div className={styles['scroll-area']}>
          <MaterialDetail
            machineLabel={machineLabel}
            material={detailMaterial}
            model={model}
            module={module}
            onApply={handleApply}
            onMovePreset={(row) => setMovePresetId(row.presetId)}
            region={region}
          />
        </div>
      ) : (
        <>
          <ControlBar onExport={() => exportMaterialLibrary()} onImport={() => importMaterialLibrary()} />
          <CategoryTabs
            favoritesCount={visibleMaterials.filter(({ id }) => favorites.includes(id)).length}
            resultCount={searchResults.length}
            searching={searching}
            visibleMaterials={visibleMaterials}
          />
          <div className={styles['scroll-area']}>
            <CatalogGrid machineLabel={machineLabel} materials={gridMaterials} />
          </div>
        </>
      )}
      <PresetEditorModal
        editingRow={editingRow}
        material={allMaterials.find(({ id }) => id === presetEditor.materialId)}
        model={model}
        module={module}
      />
      {presetEditor.open && presetEditor.presetId === 'from-layer' && (
        <ShowAddFromLayerOnce materialId={presetEditor.materialId} />
      )}
      {movePresetId && <MovePresetModal onClose={() => setMovePresetId(null)} presetId={movePresetId} />}
    </div>
  );

  const title = (
    <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <span style={{ whiteSpace: 'nowrap' }}>{t.title}</span>
      <span style={{ color: '#888', fontSize: 13, fontWeight: 400, whiteSpace: 'nowrap' }}>
        {t.machine}: <Tag style={{ marginLeft: 4 }}>{machineLabel}</Tag>
      </span>
      {materialCatalogCache.isUsingBundled() && (
        <Typography.Text className={styles['bundled-hint']}>{t.showing_bundled}</Typography.Text>
      )}
    </div>
  );

  const handleClose = () => {
    reset();
    onClose();
  };

  if (isMobile) {
    return (
      <Drawer height="92%" onClose={handleClose} open placement="bottom" title={title}>
        {body}
      </Drawer>
    );
  }

  return (
    <DraggableModal footer={null} onCancel={handleClose} open title={title}>
      {body}
    </DraggableModal>
  );
};

/** Bridges the detail view's "From current layer" action to the standalone dialog */
const ShowAddFromLayerOnce = ({ materialId }: { materialId?: string }): null => {
  const { closeEditors } = useMaterialBrowserStore();

  useEffect(() => {
    closeEditors();
    showAddPresetFromLayer({ defaultMaterialId: materialId });
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  return null;
};

export default MaterialBrowser;
