const mockRecalculateDimensions = jest.fn();
const mockGetBBox = jest.fn((elem: SVGElement) => ({
  height: 10,
  width: (elem.textContent?.length ?? 0) * 10,
  x: 0,
  y: 0,
}));
const mockSetIsVertical = jest.fn();
const mockUpdateElementColor = jest.fn();

jest.mock('@core/app/components/beambox/RightPanel/contexts/ObjectPanelController', () => ({
  updateDimensionValues: jest.fn(),
}));
jest.mock('@core/app/svgedit/selector', () => ({
  getSelectorManager: () => ({
    requestSelector: jest.fn(),
    resizeSelectors: jest.fn(),
  }),
}));
jest.mock('@core/app/svgedit/text/textactions', () => ({
  setIsVertical: mockSetIsVertical,
}));
jest.mock('@core/app/svgedit/transform/recalculate', () => ({
  recalculateDimensions: mockRecalculateDimensions,
}));
jest.mock('@core/app/svgedit/utils/getBBox', () => ({
  getBBox: mockGetBBox,
}));
jest.mock('@core/helpers/color/updateElementColor', () => mockUpdateElementColor);

import { renderText } from './renderText';

const createText = (columnCount: null | number = null): SVGTextElement => {
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text') as SVGTextElement;

  text.setAttribute('font-size', '10');
  text.setAttribute('x', '10');
  text.setAttribute('y', '20');

  if (columnCount !== null) {
    text.setAttribute('data-column-count', columnCount.toString());
  }

  document.body.appendChild(text);

  return text;
};

const getPositions = (text: SVGTextElement): Array<{ x: null | string; y: null | string }> =>
  Array.from(text.querySelectorAll('tspan')).map((tspan) => ({
    x: tspan.getAttribute('x'),
    y: tspan.getAttribute('y'),
  }));

describe('renderText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  test('should render lines without columns by default', () => {
    const text = createText();

    renderText(text, 'A\u0085BB\u0085CCC');

    expect(getPositions(text)).toEqual([
      { x: '10', y: '20.00' },
      { x: '10', y: '30.00' },
      { x: '10', y: '40.00' },
    ]);
    expect(mockGetBBox).not.toHaveBeenCalled();
  });

  test('should keep a spanning row out of the column widths wherever it sits', () => {
    const text = createText(3);

    // rows 0 and 1 span every column, only 'AAAA', 'BB' and 'CCC' set the column widths
    renderText(text, 'Heading\u0085\u0085\u0085LongFullRowValue\u0085\u0085\u0085AAAA\u0085BB\u0085CCC');

    expect(getPositions(text)).toEqual([
      { x: '10.00', y: '20.00' },
      { x: '50.00', y: '20.00' },
      { x: '70.00', y: '20.00' },
      { x: '10.00', y: '30.00' },
      { x: '50.00', y: '30.00' },
      { x: '70.00', y: '30.00' },
      { x: '10.00', y: '40.00' },
      { x: '50.00', y: '40.00' },
      { x: '70.00', y: '40.00' },
    ]);
  });

  test('should measure and arrange columns before recalculating dimensions', () => {
    const text = createText(3);
    let positionsAtRecalculation: ReturnType<typeof getPositions> = [];

    mockRecalculateDimensions.mockImplementationOnce(() => {
      positionsAtRecalculation = getPositions(text);
    });

    renderText(text, 'Heading\u0085\u0085\u0085AAAA\u0085BB\u0085CCC\u0085D\u0085EEEEE\u0085F');

    expect(mockGetBBox).toHaveBeenCalledTimes(6);
    expect(positionsAtRecalculation).toEqual([
      { x: '10.00', y: '20.00' },
      { x: '50.00', y: '20.00' },
      { x: '100.00', y: '20.00' },
      { x: '10.00', y: '30.00' },
      { x: '50.00', y: '30.00' },
      { x: '100.00', y: '30.00' },
      { x: '10.00', y: '40.00' },
      { x: '50.00', y: '40.00' },
      { x: '100.00', y: '40.00' },
    ]);
  });
});
