import { act, renderHook, waitFor } from '@testing-library/react';

const mockOutlineText = jest.fn();
const mockSetExtrusionSource = jest.fn();
const source = {
  depth: 1,
  geometryMarkup: '<path d="M0 0H10V10H0Z" />',
  markup: '<text id="source-text" font-size="20">Flux</text>',
  scale: 0.1,
  type: 'svg' as const,
};

jest.mock('@core/app/svgedit/operations/import/importStl/importText', () => ({
  outlineText: (...args: unknown[]) => mockOutlineText(...args),
}));
jest.mock('@core/app/svgedit/polygon', () => ({ computePolygonPoints: jest.fn() }));
jest.mock('@core/app/svgedit/stl/extrusionSource', () => ({
  extrusionSourceEvents: { off: jest.fn(), on: jest.fn() },
  getExtrusionSourceElement: () => {
    const root = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    root.innerHTML = source.markup;

    return root.firstElementChild;
  },
  parseExtrusionSource: () => source,
  setExtrusionSource: (...args: unknown[]) => mockSetExtrusionSource(...args),
}));
import useThreeDSourceOptions from './useThreeDSourceOptions';

describe('useThreeDSourceOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOutlineText.mockResolvedValue('<path d="M0 0H20V20H0Z" />');
  });

  test('exposes retained text and rebuilds the outlined source after editing', async () => {
    const projection = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

    projection.id = 'projection';

    const { result } = renderHook(() => useThreeDSourceOptions(projection));

    expect(result.current.sourceElem).toHaveTextContent('Flux');
    await act(async () => result.current.onTextChange?.());

    await waitFor(() => expect(mockSetExtrusionSource).toHaveBeenCalledTimes(1));
    expect(mockSetExtrusionSource).toHaveBeenCalledWith(
      projection,
      expect.objectContaining({
        geometryMarkup: '<path d="M0 0H20V20H0Z" />',
        markup: expect.stringContaining('<text'),
      }),
      expect.objectContaining({ mergeWithPreviousHistory: true, sourceElement: expect.any(SVGElement) }),
    );
  });
});
