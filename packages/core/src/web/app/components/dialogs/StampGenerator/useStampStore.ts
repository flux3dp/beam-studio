import paper from 'paper';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

import fontFuncs from '@core/app/actions/beambox/font-funcs';
import { applyBundledFontStyle } from '@core/helpers/fonts/bundledFonts';
import getDefaultFont from '@core/helpers/fonts/getDefaultFont';

import { buildPreviewSvg, buildStampShape } from './builders/buildShape';
import { parseTemplate } from './builders/buildTemplate';
import { PX_TO_MM_RATIO, SEAL_FONT_POSTSCRIPT_NAME } from './constants';
import { getTemplateById } from './templates';
import type { ParsedTemplate, StampShape, StampState, StampTemplate, TextOptionValues } from './types';

/** Bundled 教育部標準楷書; falls back to the user's default font if it can't be resolved. */
const getSealFont = (): TextOptionValues['font'] => {
  const sealFont = fontFuncs.getFontOfPostscriptName(SEAL_FONT_POSTSCRIPT_NAME);

  if (sealFont?.postscriptName === SEAL_FONT_POSTSCRIPT_NAME) {
    applyBundledFontStyle(SEAL_FONT_POSTSCRIPT_NAME);

    return { family: sealFont.family, postscriptName: sealFont.postscriptName, style: sealFont.style };
  }

  const { font_family, font_postscriptName } = getDefaultFont();
  const fontObj = fontFuncs.getFontOfPostscriptName(font_postscriptName);

  return { family: font_family, postscriptName: font_postscriptName, style: fontObj?.style ?? 'Regular' };
};

const getDefaultState = (template: StampTemplate): StampState => {
  const font = getSealFont();

  return {
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
          bold: t.bold ?? false,
          enabled: true,
          font,
          fontSize: 8,
          letterSpacing: 0,
          lineSpacing: 1.2,
          text: t.placeholder,
        },
      ]),
    ),
  };
};

interface StoreState {
  /** Bumped per applyOptions call so a slower, older build can't overwrite a newer one. */
  buildVersion: number;
  isModified: boolean;
  parsed: null | ParsedTemplate;
  previewSvg: null | SVGSVGElement;
  project: null | paper.Project;
  shape: null | StampShape;
  /** Design px → export px scale: (target width mm × PX_TO_MM_RATIO) / outline width. */
  sizeRatio: number;
  state: null | StampState;
  template: null | StampTemplate;
}

const initialState: StoreState = {
  buildVersion: 0,
  isModified: false,
  parsed: null,
  previewSvg: null,
  project: null,
  shape: null,
  sizeRatio: 1,
  state: null,
  template: null,
};

const useStampStore = create(
  combine(initialState, (set, get) => {
    /** Rebuilds shape + preview from the current template and state. Stale builds are discarded. */
    const applyOptions = async (): Promise<void> => {
      const { parsed, project, state, template } = get();

      if (!parsed || !project || !state || !template) return;

      const buildVersion = get().buildVersion + 1;

      set({ buildVersion });
      project.activate();

      const shape = await buildStampShape(parsed, template, state);

      if (get().buildVersion !== buildVersion) {
        shape.group.remove();

        return;
      }

      get().shape?.group.remove();

      const widthMm = template.sizes[state.sizeIndex]?.widthMm ?? template.sizes[0].widthMm;

      set({ previewSvg: buildPreviewSvg(shape), shape, sizeRatio: (widthMm * PX_TO_MM_RATIO) / shape.bounds.width });
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

        set({ isModified: false, parsed, project, shape: null, state: getDefaultState(template), template });
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
