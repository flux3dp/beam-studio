import {
  calculateTop, TopRef, calculateRight, RightRef,
} from './absolute-position-helper';

jest.mock('app/actions/beambox/constant', () => ({
  topBarHeight: 10,
  layerListHeight: 20,
  menuberHeight: 30,
  rightPanelScrollBarWidth: 40,
  rightPanelWidth: 50,
}));

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
});
