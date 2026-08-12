import { getBundledCatalog } from '@core/app/constants/material-catalog';
import { axiosFluxId } from '@core/helpers/api/flux-id';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import type { Material, MaterialCatalog, MaterialPreset } from '@core/interfaces/IMaterial';

import { getMaterialRegion } from './utils';

/**
 * Flip once the FLUX Cloud material-catalog endpoint ships
 * (contract: docs/material-catalog-api.md).
 */
const CLOUD_CATALOG_ENABLED = false;

const CATALOG_PATH = '/api/beam-studio/material-catalog/';

export const materialCatalogEventEmitter = eventEmitterFactory.createEventEmitter('material-catalog');

/**
 * Singleton catalog source. Resolution order: cloud cache (in-memory only — never
 * persisted to localStorage) → bundled snapshot. All failures fall back silently.
 */
class MaterialCatalogCache {
  private cache: MaterialCatalog | null = null;
  private loading: null | Promise<MaterialCatalog> = null;

  /** Current best catalog; resolves immediately from cache/bundle, fetching in background */
  async getCatalog(): Promise<MaterialCatalog> {
    if (this.cache) return this.cache;

    if (this.loading) return this.loading;

    this.loading = (async () => {
      const remote = await this.fetchRemote(0);

      this.cache = remote ?? getBundledCatalog();

      return this.cache;
    })().finally(() => {
      this.loading = null;
    });

    return this.loading;
  }

  /** Synchronous access for non-async consumers (apply pipeline, postPresetChange) */
  getCatalogSync(): MaterialCatalog {
    return this.cache ?? getBundledCatalog();
  }

  /** Background refresh; hot-swaps the cache and notifies listeners when a newer version lands */
  async refresh(): Promise<void> {
    const currentVersion = this.getCatalogSync().version;
    const remote = await this.fetchRemote(currentVersion);

    if (remote && remote.version > currentVersion) {
      this.cache = remote;
      materialCatalogEventEmitter.emit('updated', remote);
    }
  }

  findPresetById(presetId: string): null | { material: Material; preset: MaterialPreset } {
    for (const material of this.getCatalogSync().materials) {
      const preset = material.presets.find(({ id }) => id === presetId);

      if (preset) return { material, preset };
    }

    return null;
  }

  /** True when a cloud catalog is expected but none is loaded (drives the "built-in catalog" hint) */
  isUsingBundled(): boolean {
    return CLOUD_CATALOG_ENABLED && (!this.cache || this.cache.version === 0);
  }

  clear(): void {
    this.cache = null;
    this.loading = null;
  }

  private async fetchRemote(version: number): Promise<MaterialCatalog | null> {
    if (!CLOUD_CATALOG_ENABLED) return null;

    try {
      const response = await axiosFluxId.get(CATALOG_PATH, {
        params: { locale: i18n.getActiveLang(), region: getMaterialRegion(), version },
        timeout: 10000,
      });

      // axiosFluxId resolves errors as { error }
      if (!response || 'error' in response) return null;

      const data = response.data as MaterialCatalog | { upToDate: true; version: number };

      // Up-to-date short-circuit or malformed payload: keep what we have
      if (!data || !Array.isArray((data as MaterialCatalog).materials)) return null;

      return data as MaterialCatalog;
    } catch {
      return null;
    }
  }
}

export const materialCatalogCache = new MaterialCatalogCache();
