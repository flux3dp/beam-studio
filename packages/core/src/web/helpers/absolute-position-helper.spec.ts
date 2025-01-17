import { calculateTop, TopRef, calculateRight, RightRef } from './absolute-position-helper';

jest.mock('app/constants/layout-constants', () => ({
  topBarHeight: 10,
  layerListHeight: 20,
  titlebarHeight: 30,
  rightPanelScrollBarWidth: 40,
  rightPanelWidth: 50,
}));

const mockBeamboxPreferenceRead = jest.fn();
jest.mock('app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockBeamboxPreferenceRead(...args),
}));

const mockIsDev = jest.fn();
jest.mock('helpers/is-dev', () => () => mockIsDev());

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
    jest.spyOn(document, 'querySelector').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => ({ getBoundingClientRect: jest.fn().mockReturnValueOnce({ top: 300 }) } as any)
    );
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
    const result = calculateRight(10, RightRef.RIGHT_SROLL_BAR);
    expect(result).toEqual(50);
  });

  test('RightRef.RIGHT_PANEL', () => {
    const result = calculateRight(10, RightRef.RIGHT_PANEL);
    expect(result).toEqual(60);
  });

  test('RightRef.PATH_PREVIEW_BTN with beamo', () => {
    mockBeamboxPreferenceRead.mockReturnValue('fbm1');
    const result = calculateRight(10, RightRef.PATH_PREVIEW_BTN);
    expect(result).toEqual(58);
  });

  test('RightRef.PATH_PREVIEW_BTN with Ador', () => {
    mockBeamboxPreferenceRead.mockReturnValue('ado1');
    const result = calculateRight(10, RightRef.PATH_PREVIEW_BTN);
    expect(result).toEqual(16);
  });
});
