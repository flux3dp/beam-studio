import { renderHook } from '@testing-library/react';

const mockGetObjectLayer = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getObjectLayer: (...args: any[]) => mockGetObjectLayer(...args),
}));

jest.mock('@core/app/stores/globalPreferenceStore', () => ({
  useGlobalPreferenceStore: jest.fn((selector) => selector({ use_layer_color: true })),
}));

import { getObjectLayerState, useObjectLayerState } from './useLayerColor';

describe('getObjectLayerState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '<svg><rect id="projection" /></svg>';
  });

  test('returns the layer color, visibility, and lock state', () => {
    const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    layer.setAttribute('data-color', '#123456');
    layer.setAttribute('data-lock', 'true');
    layer.setAttribute('display', 'none');
    mockGetObjectLayer.mockReturnValue({ elem: layer, title: 'Layer 1' });

    expect(getObjectLayerState('projection', true)).toEqual({
      color: '#123456',
      isLocked: true,
      isVisible: false,
    });
  });

  test('uses black when layer colors are disabled', () => {
    const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    layer.setAttribute('data-color', '#123456');
    mockGetObjectLayer.mockReturnValue({ elem: layer, title: 'Layer 1' });

    expect(getObjectLayerState('projection', false)).toEqual({
      color: '#000',
      isLocked: false,
      isVisible: true,
    });
  });

  test('does not expose an orphaned runtime object on the canvas', () => {
    mockGetObjectLayer.mockReturnValue(null);

    expect(getObjectLayerState('projection', true)).toEqual({
      color: '#000',
      isLocked: false,
      isVisible: false,
    });
  });

  test('reads layer state through the current named layer store export', () => {
    const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    layer.setAttribute('data-color', '#123456');
    mockGetObjectLayer.mockReturnValue({ elem: layer, title: 'Layer 1' });

    expect(renderHook(() => useObjectLayerState('projection')).result.current).toEqual({
      color: '#123456',
      isLocked: false,
      isVisible: true,
    });
  });
});
