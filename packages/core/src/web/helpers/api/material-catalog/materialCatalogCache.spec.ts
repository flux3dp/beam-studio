// Build the real bundled catalog (the central presets mock would empty it)
jest.unmock('@core/app/constants/presets');

const mockGet = jest.fn();

jest.mock('@core/helpers/api/flux-id', () => ({
  axiosFluxId: { get: (...args: unknown[]) => mockGet(...args) },
}));

import { materialCatalogCache, materialCatalogEventEmitter } from './materialCatalogCache';

describe('materialCatalogCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    materialCatalogCache.clear();
  });

  test('falls back to bundled catalog with cloud fetch disabled', async () => {
    const catalog = await materialCatalogCache.getCatalog();

    expect(catalog.version).toBe(0);
    expect(catalog.materials.length).toBeGreaterThan(0);
    expect(mockGet).not.toHaveBeenCalled();
    // No hint while the cloud catalog is disabled — bundled is the norm, not degraded
    expect(materialCatalogCache.isUsingBundled()).toBe(false);
  });

  test('getCatalogSync returns bundled before any load', () => {
    expect(materialCatalogCache.getCatalogSync().version).toBe(0);
  });

  test('findPresetById resolves catalog presets and returns null for unknown', async () => {
    await materialCatalogCache.getCatalog();

    const hit = materialCatalogCache.findPresetById('wood_3mm_cutting');

    expect(hit).not.toBeNull();
    expect(hit!.material.id).toBe('wood');
    expect(hit!.preset.legacyKey).toBe('wood_3mm_cutting');

    expect(materialCatalogCache.findPresetById('nope')).toBeNull();
  });

  test('refresh is a silent no-op while cloud fetch is disabled', async () => {
    const listener = jest.fn();

    materialCatalogEventEmitter.on('updated', listener);
    await materialCatalogCache.refresh();
    expect(listener).not.toHaveBeenCalled();
    expect(mockGet).not.toHaveBeenCalled();
    materialCatalogEventEmitter.removeListener('updated', listener);
  });

  test('concurrent getCatalog calls share one load', async () => {
    const [a, b] = await Promise.all([materialCatalogCache.getCatalog(), materialCatalogCache.getCatalog()]);

    expect(a).toBe(b);
  });
});
