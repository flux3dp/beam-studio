import paper from 'paper';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

import NS from '@core/app/constants/namespaces';

import { generateCustomBaseShape } from './buildKeychainCustomBaseShape';
import { applyElements, loadShape } from './buildKeychainElement';
import { applyHoles, importBasePath } from './buildKeychainShape';
import { buildKeychainView } from './buildKeychainSvgViews';
import { applyTexts } from './buildKeychainText';
import { getDefaultCategory, getDefaultState, getStateForCategory } from './categories';
import type { KeychainViewMode } from './constants';
import { PX_TO_MM_RATIO } from './constants';
import type { ElementOptionDef, KeyChainCategory, KeyChainShape, KeyChainState, TextOptionDef } from './types';

interface StoreState {
  // Paper.js cache (runtime-only, not serializable)
  basePath: null | paper.PathItem;
  // Counter incremented at the start of every async buildBaseShape call
  // — used to bail out of stale builds.
  buildVersion: number;
  // Derived dimensions for display (main = size.value, other = computed from basePath bounds)
  calculatedSize: { height: number; width: number };
  category: KeyChainCategory;
  // Paper.js cache for inner path, path for other layer decoration elements (e.g. text-body glyphs)
  innerPath: null | paper.PathItem;
  isModified: boolean;
  project: null | paper.Project;
  resultPath: null | paper.PathItem;
  // Computed result consumed by Preview and exportToCanvas
  shape: KeyChainShape | null;
  // Scale ratio derived from target size vs natural bounds
  sizeRatio: number;
  // Keychain parameters
  state: KeyChainState;
  // Preview view mode — controls which cached SVG the Preview shows
  viewMode: KeychainViewMode;
}

const initialState: StoreState = {
  basePath: null,
  buildVersion: 0,
  calculatedSize: { height: 0, width: 0 },
  category: getDefaultCategory(),
  innerPath: null,
  isModified: false,
  project: null,
  resultPath: null,
  shape: null,
  sizeRatio: 1,
  state: getDefaultState(),
  viewMode: 'design',
};

/**
 * Runs the existing decoration helpers (applyTexts, applyElements) against a temporary
 * SVG element and returns the produced child nodes as a flat array. The temp SVG is
 * never inserted into the DOM by this function — `applyTexts` may briefly attach it for
 * bbox measurement, but cleans up before returning.
 */
const buildDecorations = (
  project: paper.Project,
  state: KeyChainState,
  textDefs: TextOptionDef[],
  elementDefs: ElementOptionDef[],
): SVGElement[] => {
  const tempSvg = document.createElementNS(NS.SVG, 'svg');

  applyTexts(tempSvg, state, textDefs);
  applyElements(project, tempSvg, state, elementDefs);

  return Array.from(tempSvg.children) as SVGElement[];
};

const createEmptyShape = (project: null | paper.Project): KeyChainShape => {
  const emptySvg = document.createElementNS(NS.SVG, 'svg');

  emptySvg.setAttribute('xmlns', NS.SVG);

  const emptyPath = new paper.Path();

  return {
    bounds: project?.activeLayer.bounds ?? new paper.Rectangle(0, 0, 0, 0),
    decorations: [],
    designSvg: emptySvg,
    explodedSvg: emptySvg.cloneNode(true) as SVGSVGElement,
    innerPath: null,
    resultBasePath: emptyPath,
  };
};

const generateBaseShape = (category: KeyChainCategory): { basePath: null | paper.PathItem; project: paper.Project } => {
  const project = new paper.Project(document.createElement('canvas'));
  const { id, svgContent } = category;

  if (!svgContent) {
    return { basePath: null, project };
  }

  const basePath = importBasePath(project, svgContent);

  if (!basePath) {
    console.error('Failed to import base path for category', id);

    return { basePath: null, project };
  }

  return { basePath, project };
};

const calculateSize = (targetSize: KeyChainState['size'], basePath: null | paper.PathItem, sizeRatio?: number) => {
  const { dimension, value } = targetSize;

  if (!basePath || value <= 0 || basePath.bounds[dimension] <= 0) return null;

  sizeRatio = sizeRatio ?? (value * PX_TO_MM_RATIO) / basePath.bounds[dimension];

  const otherDim = dimension === 'width' ? 'height' : 'width';
  const otherValue = Math.round(((basePath.bounds[otherDim] * sizeRatio) / PX_TO_MM_RATIO) * 10) / 10;
  const calculatedSize = { [dimension]: value, [otherDim]: otherValue } as { height: number; width: number };

  return { calculatedSize, sizeRatio };
};

const useKeychainShapeStore = create(
  combine(initialState, (set, get) => ({
    /**
     * Composes the final shape by cloning the cached basePath and applying holes, texts, and
     * element shapes from the current state. Pure function over the store snapshot — synchronous.
     *
     * The previous shape's owned paper objects (resultBasePath, innerPath) are disposed
     * before installing the new shape.
     */
    applyOptions: (): KeyChainShape => {
      const { basePath, category, innerPath, project, shape: oldShape, sizeRatio, state } = get();
      const { defaultViewBox, options } = category;

      // Dispose previous shape's owned paper objects
      oldShape?.resultBasePath.remove();
      oldShape?.innerPath?.remove();

      if (!basePath || !project) {
        const emptyShape = createEmptyShape(project);

        set({ shape: emptyShape, sizeRatio: 1 });

        return emptyShape;
      }

      // Apply all hole boolean ops on a clone of the cached base path
      const holeDefs = options.holes ?? [];
      const resultBasePath = applyHoles(basePath.clone(), state, holeDefs, sizeRatio);
      const bounds = resultBasePath.bounds;

      // Build decoration nodes (text + element shapes)
      const textDefs = options.texts ?? [];
      const elementDefs = options.elements ?? [];
      const decorations = buildDecorations(project, state, textDefs, elementDefs);

      // Clone the cached inner path so the canonical inner path is never mutated
      const innerPathClone = innerPath ? innerPath.clone() : null;

      const buildParams = {
        bounds,
        decorations,
        defaultViewBox,
        innerPath: innerPathClone,
        resultBasePath,
      };
      const designSvg = buildKeychainView('design', buildParams);
      const explodedSvg = buildKeychainView('exploded', buildParams);

      const shape: KeyChainShape = {
        bounds,
        decorations,
        designSvg,
        explodedSvg,
        innerPath: innerPathClone,
        resultBasePath,
      };

      set({ shape });

      return shape;
    },

    /**
     * Builds (or rebuilds) the cached base path for the given category.
     * - For non-text categories, skips work when the cached basePath already matches the category id.
     * - For the text category, always rebuilds because the path is derived from user-typed text.
     *
     * Returns `true` if the caller should proceed with `applyOptions()`, or `false` when the call
     * was superseded by a newer one (stale-bail).
     */
    buildBaseShape: async (category: KeyChainCategory): Promise<boolean> => {
      const {
        basePath: cachedBasePath,
        buildVersion: oldVersion,
        category: cachedCategory,
        project: cachedProject,
        state,
      } = get();

      const { isCustomShape } = category;
      const { size } = state;

      // Cache hit: same non-custom category with valid paper objects → recompute sizeRatio + calculatedSize only
      if (!isCustomShape && category.id === cachedCategory.id && cachedProject && cachedBasePath) {
        const sizeResult = calculateSize(size, cachedBasePath);

        if (sizeResult) set(sizeResult);

        return true;
      }

      // Bump the build version so any in-flight async build can detect that it's stale
      const buildVersion = oldVersion + 1;

      set({ buildVersion });

      if (isCustomShape) {
        const customShapeOption = category.options.customShape;

        if (!customShapeOption) {
          console.error('No custom shape option found in category', category.id);
          cachedBasePath?.remove();
          get().innerPath?.remove();
          cachedProject?.remove();
          set({
            basePath: null,
            category,
            innerPath: null,
            project: new paper.Project(document.createElement('canvas')),
          });

          return true;
        }

        const customShapeValues = state.customShape;

        if (customShapeValues.element?.shapeKey) {
          await loadShape(customShapeValues.element.shapeKey);
        }

        const result = await generateCustomBaseShape(customShapeValues, state.size);

        // Stale: another buildBaseShape call has started since this one — discard our result
        if (get().buildVersion !== buildVersion) {
          result.basePath?.remove();
          result.innerPath?.remove();
          result.project.remove();

          return false;
        }

        // Winner: clean up whatever is currently cached
        const { basePath: prevBasePath, innerPath: prevInnerPath, project: prevProject } = get();

        prevBasePath?.remove();
        prevInnerPath?.remove();
        prevProject?.remove();

        set({
          basePath: result.basePath,
          category,
          innerPath: result.innerPath,
          project: result.project,
        });

        const sizeResult = calculateSize(size, result.basePath, result.sizeRatio);

        if (sizeResult) set(sizeResult);

        return true;
      }

      // Non-custom base path is fully synchronous — no race possible
      const result = generateBaseShape(category);

      cachedBasePath?.remove();
      get().innerPath?.remove();
      cachedProject?.remove();

      set({
        basePath: result.basePath,
        category,
        innerPath: null,
        project: result.project,
      });

      const sizeResult = calculateSize(size, result.basePath);

      if (sizeResult) set(sizeResult);

      return true;
    },

    reset: () => {
      const { basePath, innerPath, project, shape } = get();

      basePath?.remove();
      innerPath?.remove();
      shape?.resultBasePath.remove();
      shape?.innerPath?.remove();
      project?.remove();
      set(initialState);
    },

    setCategoryState: (category: KeyChainCategory) => {
      // Drop cached paper objects so the next buildBaseShape call rebuilds for the new category
      const { basePath, innerPath, project, shape } = get();

      basePath?.remove();
      innerPath?.remove();
      shape?.resultBasePath.remove();
      shape?.innerPath?.remove();
      project?.remove();
      set({
        basePath: null,
        category,
        innerPath: null,
        isModified: false,
        project: null,
        shape: null,
        state: getStateForCategory(category),
      });
    },

    setViewMode: (viewMode: KeychainViewMode) => {
      set({ viewMode });
    },

    updateState: (updates: Partial<KeyChainState>) => {
      set((prev) => ({ isModified: true, state: { ...prev.state, ...updates } }));
    },
  })),
);

export default useKeychainShapeStore;
