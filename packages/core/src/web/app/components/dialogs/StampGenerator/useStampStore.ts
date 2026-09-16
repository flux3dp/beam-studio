import paper from 'paper';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

import { buildPreviewSvg, parseTemplate } from './builders/buildTemplate';
import { PX_TO_MM_RATIO } from './constants';
import { getTemplateById } from './templates';
import type { ParsedTemplate, StampState, StampTemplate } from './types';

const getDefaultState = (template: StampTemplate): StampState => ({
  elements: Object.fromEntries(
    template.elements.map((e) => [e.id, { enabled: true, rotation: 0, scale: 100, shapeKey: 'plum' }]),
  ),
  flipHorizontal: true,
  invertColor: false,
  sizeIndex: 0,
  templateId: template.id,
  texts: Object.fromEntries(
    template.texts.map((t) => [
      t.id,
      {
        enabled: true,
        font: { family: '', postscriptName: '', style: '' },
        fontSize: 8,
        letterSpacing: 0,
        lineSpacing: 1.2,
        text: t.placeholder,
      },
    ]),
  ),
});

interface StoreState {
  isModified: boolean;
  parsed: null | ParsedTemplate;
  previewSvg: null | SVGSVGElement;
  project: null | paper.Project;
  /** Design px → export px scale: (target width mm × PX_TO_MM_RATIO) / outline width. */
  sizeRatio: number;
  state: null | StampState;
  template: null | StampTemplate;
}

const initialState: StoreState = {
  isModified: false,
  parsed: null,
  previewSvg: null,
  project: null,
  sizeRatio: 1,
  state: null,
  template: null,
};

const useStampStore = create(
  combine(initialState, (set, get) => {
    /** Rebuilds the preview from the current template + state. Chunk 1 only renders frames. */
    const applyOptions = (): void => {
      const { parsed, state, template } = get();

      if (!parsed || !state || !template) return;

      const widthMm = template.sizes[state.sizeIndex]?.widthMm ?? template.sizes[0].widthMm;
      const sizeRatio = (widthMm * PX_TO_MM_RATIO) / parsed.outline.bounds.width;

      set({ previewSvg: buildPreviewSvg(parsed), sizeRatio });
    };

    return {
      applyOptions,

      reset: (): void => {
        get().project?.remove();
        set({ ...initialState });
      },

      /** Enters the editor for a template: parses its SVG into paper and initializes user state. */
      selectTemplate: (templateId: string): void => {
        const template = getTemplateById(templateId);

        if (!template) return;

        get().project?.remove();

        const project = new paper.Project(document.createElement('canvas'));
        const parsed = parseTemplate(project, template);

        set({ isModified: false, parsed, project, state: getDefaultState(template), template });
        applyOptions();
      },

      updateState: (patch: Partial<StampState>): void => {
        const { state } = get();

        if (!state) return;

        set({ isModified: true, state: { ...state, ...patch } });
        applyOptions();
      },
    };
  }),
);

export default useStampStore;
