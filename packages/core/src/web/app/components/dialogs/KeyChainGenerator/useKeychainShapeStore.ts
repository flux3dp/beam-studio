import paper from 'paper';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

import NS from '@core/app/constants/namespaces';

import { applyHoles, importBasePath } from './buildKeychainShape';
import { applyTexts } from './buildKeychainText';
import { getDefaultState, getStateForCategory } from './categories';
import type { HoleOptionDef, KeyChainCategory, KeyChainShape, KeyChainState, TextOptionDef } from './types';

interface StoreState {
  // Paper.js cache (runtime-only, not serializable)
  basePath: null | paper.PathItem;
  categoryId: null | string;
  isModified: boolean;
  project: null | paper.Project;
  resultPath: null | paper.PathItem;
  // Computed result consumed by Preview and exportToCanvas
  shape: KeyChainShape | null;
  // Keychain parameters
  state: KeyChainState;
}

const initialState: StoreState = {
  basePath: null,
  categoryId: null,
  isModified: false,
  project: null,
  resultPath: null,
  shape: null,
  state: getDefaultState(),
};

const generateBaseShape = (category: KeyChainCategory): { basePath: null | paper.PathItem; project: paper.Project } => {
  const project = new paper.Project(document.createElement('canvas'));
  const { id, svgContent } = category;
  const basePath = importBasePath(project, svgContent);

  if (!basePath) {
    console.error('Failed to import base path for category', id);

    return { basePath: null, project };
  }

  return { basePath, project };
};

const useKeychainShapeStore = create(
  combine(initialState, (set, get) => ({
    buildShape: (category: KeyChainCategory): KeyChainShape => {
      let { basePath, categoryId, project, state } = get();

      const { defaultViewBox, id, options } = category;

      // Re-import SVG only when category changes
      if (id !== categoryId || !project || !basePath) {
        ({ basePath, project } = generateBaseShape(category));

        set({ basePath, categoryId: id, project });

        const svgElement = document.createElementNS(NS.SVG, 'svg');

        if (!basePath) {
          const shape: KeyChainShape = {
            bounds: project.activeLayer.bounds,
            svgElement,
          };

          set({ shape });

          return shape;
        }
      }

      // Clone the cached base path so the original is never mutated
      let resultPath: paper.PathItem = basePath.clone();
      // Apply all hole boolean ops in batch
      const holeDefs = options.filter((o): o is HoleOptionDef => o.type === 'hole');

      resultPath = applyHoles(resultPath, state, holeDefs);

      const { height, width, x, y } = resultPath.bounds;
      const left = Math.min(x - 5, defaultViewBox.x);
      const top = Math.min(y - 5, defaultViewBox.y);
      const right = Math.max(x + width + 5, defaultViewBox.x + defaultViewBox.width);
      const bottom = Math.max(y + height + 5, defaultViewBox.y + defaultViewBox.height);
      const viewBox = { height: bottom - top, width: right - left, x: left, y: top };

      const svg = document.createElementNS(NS.SVG, 'svg');
      const path = resultPath.exportSVG({ asString: false }) as SVGPathElement;

      path.setAttribute('stroke-width', '2');
      svg.setAttribute('xmlns', NS.SVG);
      svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.appendChild(path);

      // Apply text elements
      const textDefs = options.filter((o): o is TextOptionDef => o.type === 'text');

      applyTexts(svg, state, textDefs);

      // Clean up the clone (keep basePath intact for next call)
      resultPath.remove();

      const shape: KeyChainShape = { bounds: resultPath.bounds, svgElement: svg };

      set({ shape });

      return shape;
    },

    reset: () => {
      const { project } = get();

      project?.remove();
      set(initialState);
    },

    setCategoryState: (category: KeyChainCategory) => {
      set({ isModified: false, state: getStateForCategory(category) });
    },

    updateState: (updates: Partial<KeyChainState>) => {
      set((prev) => ({ isModified: true, state: { ...prev.state, ...updates } }));
    },
  })),
);

export default useKeychainShapeStore;
