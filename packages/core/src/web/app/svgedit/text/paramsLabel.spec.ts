import { match } from 'ts-pattern';

import MessageCaller from '@core/app/actions/message-caller';
import { setStorage } from '@core/app/stores/storageStore';
import i18n from '@core/helpers/i18n';
import { isParamsLabelDev } from '@core/helpers/is-dev';

import history from '../history/history';

const SEPARATOR = '\u0085';
const SVG_NS = 'http://www.w3.org/2000/svg';

const mockOpenMessage = jest.spyOn(MessageCaller, 'openMessage').mockResolvedValue(undefined);

jest.mock('@core/helpers/is-dev');

const mockGetData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  attributeMap: {
    amAngleMap: 'data-amAngleMap',
    colorCurvesMap: 'data-colorCurvesMap',
    power: 'data-strength',
    speed: 'data-speed',
  },
  getConfigKeys: jest.fn(() => []),
  getData: mockGetData,
  objectConfig: ['amAngleMap', 'colorCurvesMap'],
}));

const mockGetObjectLayer = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({ getObjectLayer: mockGetObjectLayer }));

/** svgedit resizes a text element through its transform, and works on the selected element */
let selectedElem: null | SVGTextElement = null;

const mockSetSvgElemSize = jest.fn((para: string, val: number) => {
  const [sx, sy] = para === 'width' ? [val / 100, 1] : [1, val / 100];

  selectedElem?.setAttribute('transform', `matrix(${sx},0,0,${sy},0,0)`);
});

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (cb: (globalSVG: { Canvas: unknown }) => void) => cb({ Canvas: { setSvgElemSize: mockSetSvgElemSize } }),
}));

const mockAddCommandToHistory = jest.fn();

jest.mock('../history/undoManager', () => ({ addCommandToHistory: mockAddCommandToHistory }));

const mockGetSelectedElements = jest.fn();
const mockSelectOnly = jest.fn((elems: SVGTextElement[]) => {
  [selectedElem] = elems;
});

jest.mock('../selection', () => ({
  getSelectedElements: mockGetSelectedElements,
  selectOnly: mockSelectOnly,
}));

jest.mock('../selector', () => ({ getSelectorManager: () => ({ resizeSelectors: jest.fn() }) }));

const mockGetBBox = jest.fn();

jest.mock('../utils/getBBox', () => ({ getBBox: mockGetBBox }));

const mockCreateNewText = jest.fn();

jest.mock('./createNewText', () => mockCreateNewText);

const mockRenderText = jest.fn((elem: SVGTextElement, val?: string) => {
  if (typeof val !== 'string') return;

  elem.replaceChildren();
  val.split(SEPARATOR).forEach((line) => {
    const tspan = document.createElementNS(SVG_NS, 'tspan');

    tspan.textContent = line;
    elem.appendChild(tspan);
  });
});

jest.mock('./textedit/renderText', () => ({ renderText: mockRenderText }));
jest.mock('./textedit/setters', () => ({ textContentEvents: { emit: jest.fn() } }));

import { createParamsLabel, layerNameKey, renderParamsLabel } from './paramsLabel';

const historyHandler = { handleHistoryEvent: () => {}, renderText: mockRenderText };

const createLabel = (): SVGTextElement => {
  const elem = document.createElementNS(SVG_NS, 'text');

  elem.setAttribute('data-params-label', 'true');
  elem.setAttribute('data-column-count', '3');
  elem.setAttribute('data-params-label-keys', `speed,power,${layerNameKey}`);
  elem.setAttribute('font-size', '100');
  elem.id = 'params_label_1';

  return elem;
};

/** A label that already shows something, i.e. anything but a label being created */
const createRenderedLabel = (): SVGTextElement => {
  const elem = createLabel();

  mockRenderText(elem, 'power: 15 %  ');
  elem.setAttribute('transform', 'matrix(2,0,0,2,0,0)');

  return elem;
};

describe('paramsLabel', () => {
  beforeAll(() => {
    // ChangeElementCommand touches these while (un)applying
    window.svgedit.transformlist = {
      getTransformList: () => ({ numberOfItems: 0 }),
      removeElementFromListMap: jest.fn(),
    };
    window.svgedit.utilities = { getRotationAngleFromTransformList: () => 0 };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isParamsLabelDev).mockReturnValue(true);
    mockGetObjectLayer.mockReturnValue({ elem: document.createElementNS(SVG_NS, 'g'), title: 'Layer 1' });
    mockGetData.mockImplementation((_layer: unknown, key: string) =>
      match(key)
        .with('amAngleMap', () => ({ c: 75, k: 15, m: 45, y: 90 }))
        .with('colorCurvesMap', () => ({
          c: [0, 88, 170, 229, 255],
          k: [0, 60, 109, 163, 207],
          m: [0, 90, 149, 204, 241],
          y: [0, 96, 147, 186, 249],
        }))
        .with('power', () => 15)
        .with('speed', () => 20)
        .otherwise(() => undefined),
    );
    mockGetBBox.mockReturnValue({ height: 100, width: 400, x: 0, y: 0 });
    mockGetSelectedElements.mockReturnValue([]);
    setStorage('default-params-label-keys', ['speed']);
    selectedElem = null;
  });

  afterAll(() => mockOpenMessage.mockRestore());

  describe('renderParamsLabel', () => {
    it('should render the params of the layer the label sits on', () => {
      const elem = createRenderedLabel();

      renderParamsLabel(elem, { addToHistory: false });

      expect(mockRenderText).toHaveBeenLastCalledWith(
        elem,
        ['Layer 1', '', '', 'power: 15 %  ', 'speed: 20 mm/s  '].join(SEPARATOR),
      );
    });

    it('should render the saved keys when attribute is not set', () => {
      const elem = createRenderedLabel();

      elem.removeAttribute('data-params-label-keys');
      renderParamsLabel(elem, { addToHistory: false });

      expect(mockRenderText).toHaveBeenLastCalledWith(elem, 'speed: 20 mm/s  ');
    });

    it('should render long values on rows of their own before the columned params', () => {
      const elem = createRenderedLabel();

      elem.setAttribute('data-params-label-keys', `${layerNameKey},amAngleMap,colorCurvesMap,speed,power`);
      renderParamsLabel(elem, { addToHistory: false });

      expect(mockRenderText).toHaveBeenLastCalledWith(
        elem,
        [
          'Layer 1',
          '',
          '',
          'amAngleMap: {"c":75,"k":15,"m":45,"y":90}',
          '',
          '',
          'colorCurvesMap:',
          '',
          '',
          '  c: [0,88,170,229,255]',
          '',
          '',
          '  m: [0,90,149,204,241]',
          '',
          '',
          '  y: [0,96,147,186,249]',
          '',
          '',
          '  k: [0,60,109,163,207]',
          '',
          '',
          'power: 15 %  ',
          'speed: 20 mm/s  ',
        ].join(SEPARATOR),
      );
    });

    it('should pad the title row to the column count of the label', () => {
      const elem = createRenderedLabel();

      elem.setAttribute('data-column-count', '2');
      renderParamsLabel(elem, { addToHistory: false });

      expect(mockRenderText).toHaveBeenLastCalledWith(
        elem,
        ['Layer 1', '', 'power: 15 %  ', 'speed: 20 mm/s  '].join(SEPARATOR),
      );
    });

    it('should stretch the label back to the size it had before the render', () => {
      const elem = createRenderedLabel();

      renderParamsLabel(elem, { addToHistory: false });

      // Measured before the text was replaced, so the label keeps the size the user gave it
      const [renderCall] = mockRenderText.mock.invocationCallOrder.slice(-1);

      expect(mockGetBBox.mock.invocationCallOrder[0]).toBeLessThan(renderCall);
      expect(mockSetSvgElemSize).toHaveBeenNthCalledWith(1, 'width', 400, false);
      expect(mockSetSvgElemSize).toHaveBeenNthCalledWith(2, 'height', 100, false);
    });

    it('should keep the label at its natural size while it renders for the first time', () => {
      const elem = createLabel();

      renderParamsLabel(elem, { addToHistory: false });

      expect(mockSetSvgElemSize).not.toHaveBeenCalled();
    });

    it('should restore the selection it resized through', () => {
      const elem = createRenderedLabel();
      const other = createLabel();

      mockGetSelectedElements.mockReturnValue([other]);
      renderParamsLabel(elem, { addToHistory: false });

      expect(mockSelectOnly).toHaveBeenNthCalledWith(1, [elem]);
      expect(mockSelectOnly).toHaveBeenNthCalledWith(2, [other], true);
    });

    it('should leave a selection of the label itself alone', () => {
      const elem = createRenderedLabel();

      mockGetSelectedElements.mockReturnValue([elem]);
      renderParamsLabel(elem, { addToHistory: false });

      expect(mockSelectOnly).toHaveBeenCalledTimes(1);
    });

    it('should add the change to history and restore the previous label on undo', () => {
      const elem = createRenderedLabel();

      renderParamsLabel(elem);

      expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);

      const cmd = mockAddCommandToHistory.mock.calls[0][0];

      expect(elem.getAttribute('transform')).toBe('matrix(1,0,0,1,0,0)');

      cmd.unapply(historyHandler);

      expect(elem.getAttribute('transform')).toBe('matrix(2,0,0,2,0,0)');
      expect(elem.textContent).toBe('power: 15 %  ');

      cmd.apply(historyHandler);

      expect(elem.textContent).toContain('speed: 20 mm/s');
    });

    it('should collect the change into parentCmd instead of history when given one', () => {
      const elem = createRenderedLabel();
      const parentCmd = new history.BatchCommand('parent');

      renderParamsLabel(elem, { parentCmd });

      expect(mockAddCommandToHistory).not.toHaveBeenCalled();
      expect(parentCmd.isEmpty()).toBe(false);
    });

    it('should show one message per update unless showMessage is off', () => {
      renderParamsLabel(createRenderedLabel(), { addToHistory: false });

      expect(mockOpenMessage).toHaveBeenCalledTimes(1);
      expect(mockOpenMessage).toHaveBeenCalledWith(
        expect.objectContaining({ content: i18n.lang.params_label.updated, key: 'params-label-updated' }),
      );

      renderParamsLabel(createRenderedLabel(), { addToHistory: false, showMessage: false });

      expect(mockOpenMessage).toHaveBeenCalledTimes(1);
    });

    it('should render the placeholder when the label is not on a layer', () => {
      mockGetObjectLayer.mockReturnValue(undefined);

      const elem = createRenderedLabel();

      renderParamsLabel(elem, { addToHistory: false });

      expect(mockRenderText).toHaveBeenLastCalledWith(elem, i18n.lang.params_label.placeholder);
    });
  });

  describe('createParamsLabel', () => {
    it('should render the layer params before recording the new element', () => {
      const elem = createLabel();

      mockCreateNewText.mockReturnValue(elem);

      expect(createParamsLabel(100, 250)).toBe(elem);
      expect(mockCreateNewText).toHaveBeenCalledWith(100, 250, { isDefaultFont: true, isParamsLabel: true });
      expect(elem.textContent).toContain('power: 15 %');
      expect(mockSelectOnly).toHaveBeenCalledWith([elem]);
      expect(mockOpenMessage).not.toHaveBeenCalled();

      const [[cmd]] = mockAddCommandToHistory.mock.calls;

      expect(cmd).toBeInstanceOf(history.InsertElementCommand);
    });
  });
});
