import { act, renderHook } from '@testing-library/react';

enum VerticalAlign {
  BOTTOM = 0,
  MIDDLE = 1,
  TOP = 2,
}

const mockGetStartOffset = jest.fn();
const mockGetVerticalAlign = jest.fn();
const mockSetStartOffset = jest.fn();
const mockSetVerticalAlign = jest.fn();

const mockTextPathEdit = {
  getStartOffset: (...args: any[]) => mockGetStartOffset(...args),
  getVerticalAlign: (...args: any[]) => mockGetVerticalAlign(...args),
  setStartOffset: (...args: any[]) => mockSetStartOffset(...args),
  setVerticalAlign: (...args: any[]) => mockSetVerticalAlign(...args),
};

jest.mock('@core/app/actions/beambox/textPathEdit', () => ({
  __esModule: true,
  default: mockTextPathEdit,
  VerticalAlign,
}));

import { defaultTextConfigs, useTextOptionsStore } from './useTextOptionsStore';

describe('useTextOptionsStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTextOptionsStore.getState().resetConfigs();
    useTextOptionsStore.setState({
      availableFontFamilies: [],
      currentElementId: '',
      fontHistory: [],
      isLoading: false,
      styleOptions: [],
    });
  });

  describe('initial state', () => {
    test('should have default configuration', () => {
      const { result } = renderHook(() => useTextOptionsStore());

      expect(result.current.configs).toEqual(defaultTextConfigs);
      expect(result.current.availableFontFamilies).toEqual([]);
      expect(result.current.styleOptions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.currentElementId).toBe('');
      expect(result.current.fontHistory).toEqual([]);
    });
  });

  describe('configuration management', () => {
    test('should update specific config value', () => {
      const { result } = renderHook(() => useTextOptionsStore());

      act(() => {
        result.current.updateConfig('fontSize', 300);
      });

      expect(result.current.configs.fontSize).toEqual({
        hasMultiValue: false,
        value: 300,
      });
    });

    test('should set entire configs object', () => {
      const { result } = renderHook(() => useTextOptionsStore());
      const newConfigs = {
        ...defaultTextConfigs,
        fontFamily: { hasMultiValue: false, value: 'Arial' },
        fontSize: { hasMultiValue: false, value: 250 },
      };

      act(() => {
        result.current.setConfigs(newConfigs);
      });

      expect(result.current.configs.fontFamily.value).toBe('Arial');
      expect(result.current.configs.fontSize.value).toBe(250);
    });

    test('should reset configs to default', () => {
      const { result } = renderHook(() => useTextOptionsStore());

      // First modify the config
      act(() => {
        result.current.updateConfig('fontSize', 300);
      });

      expect(result.current.configs.fontSize.value).toBe(300);

      // Then reset
      act(() => {
        result.current.resetConfigs();
      });

      expect(result.current.configs).toEqual(defaultTextConfigs);
    });
  });

  describe('font management', () => {
    test('should set available font families', () => {
      const { result } = renderHook(() => useTextOptionsStore());
      const families = ['Arial', 'Times New Roman', 'Helvetica'];

      act(() => {
        result.current.setAvailableFontFamilies(families);
      });

      expect(result.current.availableFontFamilies).toEqual(families);
    });

    test('should set style options', () => {
      const { result } = renderHook(() => useTextOptionsStore());
      const options = [
        { label: 'Regular', value: 'Regular' },
        { label: 'Bold', value: 'Bold' },
      ];

      act(() => {
        result.current.setStyleOptions(options);
      });

      expect(result.current.styleOptions).toEqual(options);
    });

    test('should add to font history', () => {
      const { result } = renderHook(() => useTextOptionsStore());

      act(() => {
        result.current.addToFontHistory('Arial');
      });

      expect(result.current.fontHistory).toEqual(['Arial']);

      act(() => {
        result.current.addToFontHistory('Times New Roman');
      });

      expect(result.current.fontHistory).toEqual(['Times New Roman', 'Arial']);
    });

    test('should not add duplicate fonts to history', () => {
      const { result } = renderHook(() => useTextOptionsStore());

      act(() => {
        result.current.addToFontHistory('Arial');
        result.current.addToFontHistory('Times New Roman');
        result.current.addToFontHistory('Arial'); // Duplicate
      });

      expect(result.current.fontHistory).toEqual(['Arial', 'Times New Roman']);
    });

    test('should limit font history to maximum size', () => {
      const { result } = renderHook(() => useTextOptionsStore());

      act(() => {
        result.current.addToFontHistory('Font1');
        result.current.addToFontHistory('Font2');
        result.current.addToFontHistory('Font3');
        result.current.addToFontHistory('Font4');
        result.current.addToFontHistory('Font5');
        result.current.addToFontHistory('Font6'); // Should remove Font1
      });

      expect(result.current.fontHistory).toEqual(['Font6', 'Font5', 'Font4', 'Font3', 'Font2']);
      expect(result.current.fontHistory).toHaveLength(5);
    });

    test('should set font history directly', () => {
      const { result } = renderHook(() => useTextOptionsStore());
      const history = ['Arial', 'Times New Roman'];

      act(() => {
        result.current.setFontHistory(history);
      });

      expect(result.current.fontHistory).toEqual(history);
    });
  });

  describe('UI state management', () => {
    test('should set loading state', () => {
      const { result } = renderHook(() => useTextOptionsStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    test('should set current element id', () => {
      const { result } = renderHook(() => useTextOptionsStore());

      act(() => {
        result.current.setCurrentElementId('element-123');
      });

      expect(result.current.currentElementId).toBe('element-123');
    });
  });
});
