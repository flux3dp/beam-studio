import { match } from 'ts-pattern';

import { CanvasElements } from '@core/app/constants/canvasElements';
import { isElemFillable } from '@core/app/svgedit/operations/infill';
import { isFitText } from '@core/app/svgedit/text/textedit/getters';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';
import { isVariableTextSupported } from '@core/helpers/variableText';

export type TextOptionKey =
  | 'fit_text_align'
  | 'font'
  | 'font_size'
  | 'letter_spacing'
  | 'line_spacing'
  | 'start_offset'
  | 'text_content'
  | 'text_transform'
  | 'variable_text'
  | 'vertical_align'
  | 'vertical_switch';

export interface TextOptionContext {
  hasSingleText: boolean; // including single textpath
  isAllFitText: boolean;
  isTextPath: boolean;
  supportVariableBlock: boolean;
}

export const getVisibleTextOptions = (ctx: TextOptionContext): Set<TextOptionKey> => {
  const visible = new Set<TextOptionKey>();

  visible.add('font');
  visible.add('font_size');
  visible.add('letter_spacing');
  visible.add('text_transform');

  if (ctx.isAllFitText) visible.add('fit_text_align');

  if (ctx.isTextPath) {
    visible.add('start_offset');
    visible.add('vertical_align');
  } else {
    visible.add('line_spacing');
    visible.add('vertical_switch');

    if (ctx.hasSingleText) visible.add('text_content');

    if (ctx.supportVariableBlock) visible.add('variable_text');
  }

  return visible;
};

export type OptionPanelType = 'image' | 'polygon' | 'rect' | 'text' | 'variable_use';

export type ObjectPanelContext = {
  colorPanels: Array<'color' | 'colorPath' | 'multiColor'>;
  /** property for `infill` and `color` panel, should be `textElems` or array of given elem */
  infillElems: SVGElement[];
  infillPanels: Array<'infill' | 'infillPath'>;
  /** property for TextOption panel */
  isAllFitText: boolean;
  isTextPath: boolean;
  optionPanel: null | OptionPanelType;
  /** property for `infillPath`, `colorPath` and TextOption panel */
  pathElems: SVGElement[];
  /** property for TextOption panel */
  textElems: SVGTextElement[];
  /** property for TextOption panel */
  textOptions: Set<TextOptionKey>;
};

/**
 * Extract texts and textpaths that should be handled separately
 * And calculate context for infill panel, color panel and option panel
 * Check display requirements for infill panels in advance for getting controllable types later
 */
export const getObjectPanelContext = (
  elem: null | SVGElement,
  opts?: {
    isElemFullColor: boolean;
    supportVariableBlock: boolean;
  },
): ObjectPanelContext => {
  const context: ObjectPanelContext = {
    colorPanels: [],
    infillElems: [],
    infillPanels: [],
    isAllFitText: false,
    isTextPath: false,
    optionPanel: null,
    pathElems: [],
    textElems: [],
    textOptions: new Set(),
  };

  if (!elem) return context;

  const tagName = elem.tagName.toLowerCase();
  // Note: currently, isFullColor only works for single select
  const isFullColor = Boolean(getData(getObjectLayer(elem)?.elem, 'fullcolor'));
  const supportVariableBlock = opts?.supportVariableBlock ?? isVariableTextSupported();

  const isAllFillable = (elems: SVGElement[]) => elems.every((elem) => isElemFillable(elem));

  // Find texts and textpaths first
  if (tagName === 'text') {
    // Single text
    context.textElems = [elem as SVGTextElement];
  } else if (tagName === 'g') {
    if (elem.getAttribute('data-textpath-g')) {
      // Single textpath
      context.textElems = [elem.querySelector('text')!];
      context.pathElems = Array.from(elem.querySelectorAll('path'));
    } else if (!elem.querySelector(':scope > :not(text):not(g[data-textpath-g="1"])')) {
      // Multiple texts and textpaths (including normal group and temp group)
      context.textElems = Array.from(elem.querySelectorAll('text'));
      context.pathElems = Array.from(elem.querySelectorAll('path'));
    }
  }

  if (context.textElems.length > 0) {
    context.optionPanel = 'text';
    context.isAllFitText = context.textElems.every((element) => isFitText(element));
    context.infillElems = context.textElems;

    if (isFullColor) {
      context.colorPanels.push('color');
    } else if (isAllFillable(context.textElems)) {
      context.infillPanels.push('infill');
    }

    if (context.pathElems.length > 0) {
      context.isTextPath = true;

      if (isFullColor) {
        context.colorPanels.push('colorPath');
      } else if (isAllFillable(context.pathElems)) {
        context.infillPanels.push('infillPath');
      }
    }

    context.textOptions = getVisibleTextOptions({
      hasSingleText: context.textElems.length === 1,
      isAllFitText: context.isAllFitText,
      isTextPath: context.isTextPath,
      supportVariableBlock,
    });

    return context;
  }

  let shouldCheckInfillPanel = false;

  context.infillElems = [elem];

  match(tagName)
    .with('image', () => {
      const isFullColor = opts?.isElemFullColor ?? elem.getAttribute('data-fullcolor') === '1';

      if (!isFullColor) context.optionPanel = 'image';
    })
    .with('use', () => {
      const showVariableBlock = supportVariableBlock && elem.getAttribute('data-props');

      if (showVariableBlock) context.optionPanel = 'variable_use';

      if (isFullColor) context.colorPanels.push('multiColor');
    })
    .with('g', () => {
      if (isFullColor) context.colorPanels.push('multiColor');
      else shouldCheckInfillPanel = true;
    })
    .with(...CanvasElements.fillableElems, () => {
      if (['polygon', 'rect'].includes(tagName)) context.optionPanel = tagName as 'polygon' | 'rect';

      if (isFullColor) context.colorPanels.push('color');
      else shouldCheckInfillPanel = true;
    });

  if (shouldCheckInfillPanel && isElemFillable(elem)) {
    context.infillElems = [elem];
    context.infillPanels.push('infill');
  }

  return context;
};
