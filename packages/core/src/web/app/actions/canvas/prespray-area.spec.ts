import presprayArea from './prespray-area';

const mockGetState = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: {
    getState: () => mockGetState(),
  },
}));

const mockGetWidth = jest.fn();
const mockGetHeight = jest.fn();
const mockGetExpansion = jest.fn();

jest.mock('@core/app/svgedit/workarea', () => ({
  get expansion() {
    return mockGetExpansion();
  },
  get modelHeight() {
    return mockGetHeight();
  },
  get width() {
    return mockGetWidth();
  },
}));

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
}));

const mockRequestAnimationFrame = jest.fn();

describe('test canvas/prespray-area', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetWidth.mockReturnValue(4300);
    mockGetHeight.mockReturnValue(4000);
    mockGetExpansion.mockReturnValue([0, 0]);
    mockRequestAnimationFrame.mockImplementation((cb) => cb());
    mockGetState.mockReturnValue({
      'enable-job-origin': false,
      rotary_mode: false,
    });
    window.requestAnimationFrame = mockRequestAnimationFrame;
    document.body.innerHTML = '<svg id="fixedSizeSvg"><g class="layer" data-module="5"></g></svg>';
    jest
      .spyOn(document, 'querySelectorAll')
      .mockReturnValue(
        Array.from(document.querySelectorAll('g.layer') ?? []).filter(
          (g) => g.getAttribute('display') !== 'none',
        ) as any as NodeListOf<SVGGElement>,
      );
  });

  test('generate prespray area', () => {
    presprayArea.generatePresprayArea();
    expect(document.getElementById('fixedSizeSvg').innerHTML).toMatchSnapshot();
    expect(document.getElementById('presprayArea')).not.toBeNull();
    expect(document.getElementById('presprayArea').getAttribute('display')).not.toBe('none');
  });

  test('hide prespray area when rotary mode is on', () => {
    mockGetState.mockReturnValue({
      'enable-job-origin': false,
      rotary_mode: true,
    });
    presprayArea.generatePresprayArea();
    expect(document.getElementById('presprayArea')).not.toBeNull();
    expect(document.getElementById('presprayArea').getAttribute('display')).toBe('none');
  });

  test('toggle prespray area', () => {
    presprayArea.generatePresprayArea();
    expect(document.getElementById('presprayArea')).not.toBeNull();
    document.querySelector('.layer').setAttribute('display', 'none');
    presprayArea.togglePresprayArea();
    expect(document.getElementById('presprayArea').getAttribute('display')).toBe('none');
  });

  test('checkMouseTarget', () => {
    presprayArea.generatePresprayArea();

    const mouseTarget = document.getElementById('presprayArea');

    expect(presprayArea.checkMouseTarget(mouseTarget)).toBe(true);

    const mouseTarget2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

    expect(presprayArea.checkMouseTarget(mouseTarget2)).toBe(false);
  });

  test('drag prespray area', () => {
    presprayArea.generatePresprayArea();
    expect(presprayArea.getPosition()).toEqual({ h: 300, w: 300, x: 4000, y: 2400 });
    presprayArea.startDrag();
    presprayArea.drag(-1000, -1000);
    expect(presprayArea.getPosition()).toEqual({ h: 300, w: 300, x: 3000, y: 1400 });
    presprayArea.drag(-3000, -3000);
    expect(presprayArea.getPosition()).toEqual({ h: 300, w: 300, x: 1000, y: 0 });
    presprayArea.startDrag();
    presprayArea.drag(100, 100);
    expect(presprayArea.getPosition()).toEqual({ h: 300, w: 300, x: 1100, y: 100 });
    presprayArea.drag(10000, 10000);
    expect(presprayArea.getPosition()).toEqual({ h: 300, w: 300, x: 4000, y: 3700 });
  });
});
