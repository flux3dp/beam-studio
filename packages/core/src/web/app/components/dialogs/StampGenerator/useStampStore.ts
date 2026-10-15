import paper from 'paper';
import { funnel } from 'remeda';
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
import { isLabeled } from './types';
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

/**
 * First preferred font that resolves by name AND loads (a web font fails offline; a not-downloaded
 * macOS font fails to open), else the user's default font. Not memoized here: getFontObj already
 * caches loaded fonts and dedupes in-flight loads, while a failed load and the user's default must
 * be re-evaluated on the next selection.
 */
const resolveDefaultFont = async (preferred: ReadonlyArray<string> = []): Promise<TextOptionValues['font']> => {
  for (const postscriptName of preferred) {
    const font = fontFuncs.getFontOfPostscriptName(postscriptName);

    if (font?.postscriptName === postscriptName && (await getFontObj(font))) {
      // A bundled face needs its @font-face too: the DOM measures the text before fontkit outlines it.
      applyBundledFontStyle(postscriptName);

      return toFont(font, getUserDefaultFont());
    }
  }

  return getUserDefaultFont();
};

/** The slot's fixed face when it resolves, else the resolved default font. */
const getSlotFont = (slot: TextSlotDef, defaultFont: TextOptionValues['font']): TextOptionValues['font'] => {
  if (!slot.fontPostscriptName) return defaultFont;

  const font = fontFuncs.getFontOfPostscriptName(slot.fontPostscriptName);

  if (font?.postscriptName !== slot.fontPostscriptName) return defaultFont;

  applyBundledFontStyle(slot.fontPostscriptName);

  return toFont(font, defaultFont);
};

/** Default stroke ring width in design px, rounded to 0.05 mm at the default size so the Border tab's 0.1 mm steps land on 5s and 0s. */
const defaultLineWidth = ({ border, sizes }: StampTemplate): number => {
  const pxPerMm = border!.bounds.width / sizes[0].widthMm;
  const mm = (border!.lineWidth ?? 2) / pxPerMm;

  return Math.round(mm / 0.05) * 0.05 * pxPerMm;
};

const getDefaultState = (template: StampTemplate, defaultFont: TextOptionValues['font']): StampState => {
  return {
    border: template.border
      ? { dashed: template.border.dashed ?? false, lineWidth: defaultLineWidth(template), style: 'stroke' }
      : undefined,
    elements: Object.fromEntries(
      template.elements.map((e) => [
        e.id,
        { enabled: true, rotation: 0, scale: 100, shapeKey: e.shapeKey ?? 'stamp/plum' },
      ]),
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
          letterSpacing: t.letterSpacing ?? 0,
          lineSpacing: 1.2,
          text: t.placeholder,
        },
      ]),
    ),
  };
};

interface StoreState {
  /** Resolved default text font for the current template (kept for reset). */
  defaultFont: null | TextOptionValues['font'];
  isModified: boolean;
  parsed: null | ParsedTemplate;
  /** Template whose font probe is in flight: the UI highlights it and shows a spinner until it lands. */
  pendingTemplateId: null | string;
  previewSvg: null | SVGSVGElement;
  project: null | paper.Project;
  shape: null | StampShape;
  /** Design px → export px scale: (target width mm × PX_TO_MM_RATIO) / outline width. */
  sizeRatio: number;
  state: null | StampState;
  template: null | StampTemplate;
}

const initialState: StoreState = {
  defaultFont: null,
  isModified: false,
  parsed: null,
  pendingTemplateId: null,
  previewSvg: null,
  project: null,
  shape: null,
  sizeRatio: 1,
  state: null,
  template: null,
};

const useStampStore = create(
  combine(initialState, (set, get) => {
    // Bumped per selectTemplate / reset so a slower font probe can't land on top of a newer selection.
    let selectVersion = 0;
    // Closure counters, not state: reset() must not rewind them or a build from before the dialog closed could land.
    let buildVersion = 0;

    /** Rebuilds shape + preview from the current template and state. Stale builds are discarded. */
    const applyOptions = async (): Promise<void> => {
      const { parsed, project, state, template } = get();

      if (!parsed || !project || !state || !template) return;

      const version = ++buildVersion;

      project.activate();

      let shape: StampShape;

      try {
        shape = await buildStampShape(parsed, template, state);
      } catch (error) {
        // e.g. an Element-panel / Noun Project shape that fails to load offline: keep the last preview.
        console.error('Stamp build failed:', error);

        return;
      }

      if (version !== buildVersion) {
        shape.group.remove();

        return;
      }

      get().shape?.group.remove();

      const widthMm = template.sizes[state.sizeIndex]?.widthMm ?? template.sizes[0].widthMm;

      set({ previewSvg: buildPreviewSvg(shape), shape, sizeRatio: (widthMm * PX_TO_MM_RATIO) / shape.bounds.width });
    };

    // User edits (typing, steppers) arrive faster than a build runs; rebuild once after the burst.
    const scheduledBuild = funnel(applyOptions, { minQuietPeriodMs: 150 });

    return {
      applyOptions,

      reset: (): void => {
        selectVersion += 1;
        buildVersion += 1;
        scheduledBuild.cancel();
        get().project?.remove();
        set({ ...initialState });
      },

      /** Restores the template's default settings (texts, fonts, size, flips). */
      resetState: (): void => {
        const { defaultFont, template } = get();

        if (!template || !defaultFont) return;

        set({ isModified: false, state: getDefaultState(template, defaultFont) });
        applyOptions();
      },

      /** Enters the editor for a template: parses its SVG into paper and initializes user state. */
      selectTemplate: async (templateId: string): Promise<void> => {
        const template = getTemplateById(templateId);

        if (!template) return;

        const version = ++selectVersion;

        set({ pendingTemplateId: templateId });

        const defaultFont = await resolveDefaultFont(template.preferredFonts);

        // Superseded by a newer selectTemplate or by reset() while the probe was pending.
        if (version !== selectVersion) return;

        const project = new paper.Project(document.createElement('canvas'));
        let parsed: ParsedTemplate;

        try {
          parsed = parseTemplate(project, template);
        } catch (error) {
          // e.g. a template SVG paper can't import: keep the previous template editable.
          console.error('Stamp template failed to load:', error);
          project.remove();
          set({ pendingTemplateId: null });

          return;
        }

        get().project?.remove();
        set({
          defaultFont,
          isModified: false,
          parsed,
          pendingTemplateId: null,
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
        scheduledBuild.call();
      },

      /** Sets the font on every editable slot that isn't pinned to a fixed face. */
      updateSharedFont: (font: TextOptionValues['font']): void => {
        const { state, template } = get();

        if (!state || !template) return;

        const texts = { ...state.texts };

        for (const slot of template.texts) {
          if (isLabeled(slot) && !slot.fontPostscriptName && texts[slot.id]) {
            texts[slot.id] = { ...texts[slot.id], font };
          }
        }

        set({ isModified: true, state: { ...state, texts } });
        scheduledBuild.call();
      },

      updateState: (patch: Partial<StampState>): void => {
        const { state } = get();

        if (!state) return;

        set({ isModified: true, state: { ...state, ...patch } });
        scheduledBuild.call();
      },

      updateText: (id: string, patch: Partial<TextOptionValues>): void => {
        const { state } = get();

        if (!state?.texts[id]) return;

        set({
          isModified: true,
          state: { ...state, texts: { ...state.texts, [id]: { ...state.texts[id], ...patch } } },
        });
        scheduledBuild.call();
      },
    };
  }),
);

export default useStampStore;
