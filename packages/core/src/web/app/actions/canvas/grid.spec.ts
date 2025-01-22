const mockRead = jest.fn();

jest.mock('@core/app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockRead(...args),
}));
mockRead.mockReturnValue(true);

import grid from './grid';

const mockGetWidth = jest.fn();
const mockGetHeight = jest.fn();

jest.mock('@core/app/svgedit/workarea', () => ({
  get height() {
    return mockGetHeight();
  },
  get width() {
    return mockGetWidth();
  },
}));

describe('test canvas/grid', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockRead.mockReturnValue(true);
    document.body.innerHTML = '<svg id="canvasBackground"><svg id="fixedSizeSvg"></svg></svg>';
  });

  test('update zoom and toggle', () => {
    mockGetWidth.mockReturnValue(100);
    mockGetHeight.mockReturnValue(100);
    grid.init();
    expect(document.getElementById('canvasBackground').innerHTML).toMatchSnapshot();
    expect(document.getElementById('canvasGrid').querySelectorAll('line')).toHaveLength(4);
    grid.updateGrids(101);
    expect(document.getElementById('canvasBackground').innerHTML).toMatchSnapshot();
    expect(document.getElementById('canvasGrid').querySelectorAll('line')).toHaveLength(202);
    mockRead.mockReturnValue(false);
    grid.toggleGrids();
    expect(document.getElementById('canvasGrid').style.display).toBe('none');
  });
});
