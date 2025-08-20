import { calculateRight, calculateTop, RightRef, TopRef } from './absolute-position-helper';

jest.mock('@core/app/constants/layout-constants', () => ({
  layerListHeight: 20,
  rightPanelScrollBarWidth: 40,
  rightPanelWidth: 50,
  titlebarHeight: 30,
  topBarHeight: 10,
}));

const mockGetState = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: {
    getState: () => mockGetState(),
  },
}));

const mockIsDev = jest.fn();

jest.mock('@core/helpers/is-dev', () => () => mockIsDev());

describe('test calculateTop', () => {
  test('TopRef.WINDOW', () => {
    const result = calculateTop(10);

    expect(result).toEqual(40);
  });

  test('TopRef.TOPBAR', () => {
    const result = calculateTop(10, TopRef.TOPBAR);

    expect(result).toEqual(20);
  });

  test('TopRef.LAYER_LIST', () => {
    const result = calculateTop(10, TopRef.LAYER_LIST);

    expect(result).toEqual(40);
  });

  test('TopRef.LAYER_PARAMS', () => {
    jest
      .spyOn(document, 'querySelector')
      .mockImplementation(() => ({ getBoundingClientRect: jest.fn().mockReturnValueOnce({ top: 300 }) }) as any);

    const result = calculateTop(10, TopRef.LAYER_PARAMS);

    expect(result).toEqual(310);
  });
});

describe('test calculateRight', () => {
  test('RightRef.WINDOW', () => {
    const result = calculateRight(10);

    expect(result).toEqual(10);
  });

  test('RightRef.RIGHT_SROLL_BAR', () => {
    const result = calculateRight(10, RightRef.RIGHT_SCROLL_BAR);

    expect(result).toEqual(50);
  });

  test('RightRef.RIGHT_PANEL', () => {
    const result = calculateRight(10, RightRef.RIGHT_PANEL);

    expect(result).toEqual(60);
  });

  test('RightRef.PATH_PREVIEW_BTN with beamo', () => {
    mockGetState.mockReturnValue({ workarea: 'fbm1' });

    const result = calculateRight(10, RightRef.PATH_PREVIEW_BTN);

    expect(result).toEqual(58);
  });

  test('RightRef.PATH_PREVIEW_BTN with Ador', () => {
    mockGetState.mockReturnValue({ workarea: 'ado1' });

    const result = calculateRight(10, RightRef.PATH_PREVIEW_BTN);

    expect(result).toEqual(16);
  });
});
