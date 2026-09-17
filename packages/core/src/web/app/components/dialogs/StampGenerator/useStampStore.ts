import paper from 'paper';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

import fontFuncs, { getFontObj } from '@core/app/actions/beambox/font-funcs';
import { applyBundledFontStyle } from '@core/helpers/fonts/bundledFonts';
import getDefaultFont from '@core/helpers/fonts/getDefaultFont';
import type { GeneralFont } from '@core/interfaces/IFont';

import { buildPreviewSvg, buildStampShape } from './builders/buildShape';
import { parseTemplate } from './builders/buildTemplate';
import { PX_TO_MM_RATIO } from './constants';
import { getTemplateById } from './templates';
import type {
  ElementOptionValues,
  ParsedTemplate,
  StampShape,
  StampState,
  StampTemplate,
  TextOptionValues,
  TextSlotDef,
} from './types';

/** Regular (upright, normal weight) face of a family when it has one; families often list italics first. */
export const pickRegularFace = (faces: GeneralFont[]): GeneralFont | undefined =>
  faces.find((f) => !f.italic && f.weight === 400) ?? faces.find((f) => !f.italic) ?? faces[0];

const toFont = (font: GeneralFont | undefined, fallback: TextOptionValues['font']): TextOptionValues['font'] =>
  font ? { family: font.family, postscriptName: font.postscriptName, style: font.style ?? 'Regular' } : fallback;

const getUserDefaultFont = (): TextOptionValues['font'] => {
  const { font_family, font_postscriptName } = getDefaultFont();

  return toFont(fontFuncs.getFontOfPostscriptName(font_postscriptName), {
    family: font_family,
    postscriptName: font_postscriptName,
    style: 'Regular',
  });
};

const defaultFontCache = new Map<string, Promise<TextOptionValues['font']>>();

/**
 * First preferred font that resolves by name AND loads (a web font fails offline; a not-downloaded
 * macOS font fails to open), else the user's default font. Probed once per candidate list per session.
 */
const resolveDefaultFont = (preferred: ReadonlyArray<string> = []): Promise<TextOptionValues['font']> => {
  const key = preferred.join('|');
  let promise = defaultFontCache.get(key);

  if (!promise) {
    promise = (async () => {
      for (const postscriptName of preferred) {
        const font = fontFuncs.getFontOfPostscriptName(postscriptName);

        if (font?.postscriptName === postscriptName && (await getFontObj(font))) {
          return toFont(font, getUserDefaultFont());
        }
      }

      return getUserDefaultFont();
    })();
    defaultFontCache.set(key, promise);
  }

  return promise;
};

/** The slot's fixed face when it resolves, else the resolved default font. */
const getSlotFont = (slot: TextSlotDef, defaultFont: TextOptionValues['font']): TextOptionValues['font'] => {
  if (!slot.fontPostscriptName) return defaultFont;

  const font = fontFuncs.getFontOfPostscriptName(slot.fontPostscriptName);

  if (font?.postscriptName !== slot.fontPostscriptName) return defaultFont;

  applyBundledFontStyle(slot.fontPostscriptName);

  return toFont(font, defaultFont);
};

const getDefaultState = (template: StampTemplate, defaultFont: TextOptionValues['font']): StampState => {
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
          enabled: true,
          font: getSlotFont(t, defaultFont),
          fontSize: 'fontSize' in t && t.fontSize ? t.fontSize : 8,
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
      selectTemplate: async (templateId: string): Promise<void> => {
        const template = getTemplateById(templateId);

        if (!template) return;

        const defaultFont = await resolveDefaultFont(template.preferredFonts);

        get().project?.remove();

        const project = new paper.Project(document.createElement('canvas'));
        const parsed = parseTemplate(project, template);

        set({
          isModified: false,
          parsed,
          project,
          shape: null,
          state: getDefaultState(template, defaultFont),
          template,
        });
        applyOptions();
      },

      updateElement: (id: string, patch: Partial<ElementOptionValues>): void => {
        const { state } = get();

        if (!state?.elements[id]) return;

        set({
          isModified: true,
          state: { ...state, elements: { ...state.elements, [id]: { ...state.elements[id], ...patch } } },
        });
        applyOptions();
      },

      /** Sets the font on every editable slot that isn't pinned to a fixed face. */
      updateSharedFont: (font: TextOptionValues['font']): void => {
        const { state, template } = get();

        if (!state || !template) return;

        const texts = { ...state.texts };

        for (const slot of template.texts) {
          if (slot.labelKey && !slot.fontPostscriptName && texts[slot.id]) texts[slot.id] = { ...texts[slot.id], font };
        }

        set({ isModified: true, state: { ...state, texts } });
        applyOptions();
      },

      updateState: (patch: Partial<StampState>): void => {
        const { state } = get();

        if (!state) return;

        set({ isModified: true, state: { ...state, ...patch } });
        applyOptions();
      },

      updateText: (id: string, patch: Partial<TextOptionValues>): void => {
        const { state } = get();

        if (!state?.texts[id]) return;

        set({
          isModified: true,
          state: { ...state, texts: { ...state.texts, [id]: { ...state.texts[id], ...patch } } },
        });
        applyOptions();
      },
    };
  }),
);

export default useStampStore;
