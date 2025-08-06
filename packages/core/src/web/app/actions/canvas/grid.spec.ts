const mockGetState = jest.fn();
const mockSubscribe = jest.fn();

jest.mock('@core/app/stores/globalPreferenceStore', () => ({
  useGlobalPreferenceStore: {
    getState: mockGetState,
    subscribe: mockSubscribe,
  },
}));

import grid from './grid';

const mockGetWidth = jest.fn();
const mockGetHeight = jest.fn();
const mockGetMaxY = jest.fn();
const mockGetMinY = jest.fn();

jest.mock('@core/app/svgedit/workarea', () => ({
  get height() {
    return mockGetHeight();
  },
  get maxY() {
    return mockGetMaxY();
  },
  get minY() {
    return mockGetMinY();
  },
  get width() {
    return mockGetWidth();
  },
}));

describe('test canvas/grid', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetState.mockReturnValue({ show_grids: true });
    document.body.innerHTML = '<svg id="canvasBackground"></svg>';
  });

  test('update zoom and toggle', () => {
    mockGetWidth.mockReturnValue(100);
    mockGetHeight.mockReturnValue(100);
    mockGetMaxY.mockReturnValue(84.5);
    mockGetMinY.mockReturnValue(-15.5);
    grid.init();
    expect(document.getElementById('canvasBackground').innerHTML).toMatchSnapshot();
    expect(document.getElementById('canvasGrid').querySelectorAll('line')).toHaveLength(3);
    grid.updateGrids(101);
    expect(document.getElementById('canvasBackground').innerHTML).toMatchSnapshot();
    expect(document.getElementById('canvasGrid').querySelectorAll('line')).toHaveLength(201);

    const [selector, callback] = mockSubscribe.mock.calls[0];

    callback(selector({ show_grids: false }));
    expect(document.getElementById('canvasGrid').style.display).toBe('none');
  });
});
