import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';

const checkWebGL = jest.fn();

jest.mock('@core/helpers/check-webgl', () => checkWebGL);

const isCanvasEmpty = jest.fn();

jest.mock('@core/helpers/layer/checkContent', () => ({
  isCanvasEmpty,
}));

const getSVGAsync = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync,
}));

const clearSelection = jest.fn();

getSVGAsync.mockImplementation((callback) => {
  callback({
    Canvas: {
      clearSelection,
    },
  });
});

import PathPreviewButton from './PathPreviewButton';

const mockUseWorkarea = jest.fn();

jest.mock('@core/helpers/hooks/useWorkarea', () => () => mockUseWorkarea());

describe('test PathPreviewButton', () => {
  beforeEach(() => {
    useCanvasStore.getState().setMode(CanvasMode.PathPreview);
  });

  test('no WebGL', () => {
    checkWebGL.mockReturnValue(false);

    const { container } = render(<PathPreviewButton isDeviceConnected />);

    expect(container).toMatchSnapshot();
  });

  describe('workarea is Ador', () => {
    it('should not render', () => {
      mockUseWorkarea.mockReturnValue('ado1');

      const { container } = render(<PathPreviewButton isDeviceConnected />);

      expect(container).toMatchSnapshot();
    });
  });

  describe('has WebGL', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      checkWebGL.mockReturnValue(true);
      useCanvasStore.getState().setMode(CanvasMode.PathPreview);
    });

    test('no devices connected in web version', () => {
      window.FLUX.version = 'web';
      checkWebGL.mockReturnValue(true);

      const { container } = render(<PathPreviewButton isDeviceConnected={false} />);

      expect(container).toMatchSnapshot();
    });

    test('no devices connected in desktop version', () => {
      window.FLUX.version = '1.2.3';

      const { container } = render(<PathPreviewButton isDeviceConnected={false} />);

      expect(container).toMatchSnapshot();
    });

    describe('has devices connected', () => {
      beforeEach(() => {
        jest.resetAllMocks();
        useCanvasStore.getState().setMode(CanvasMode.PathPreview);
      });

      test('is path previewing', () => {
        checkWebGL.mockReturnValue(true);

        const { container } = render(<PathPreviewButton isDeviceConnected />);

        fireEvent.click(container.querySelector('div[class*="button"]'));
        expect(clearSelection).not.toHaveBeenCalled();
      });

      describe('is not path previewing', () => {
        beforeEach(() => {
          jest.resetAllMocks();
          useCanvasStore.getState().setMode(CanvasMode.Draw);
        });

        test('with empty canvas', () => {
          checkWebGL.mockReturnValue(true);
          isCanvasEmpty.mockReturnValue(true);

          const { container } = render(<PathPreviewButton isDeviceConnected />);

          fireEvent.click(container.querySelector('div[class*="button"]'));
          expect(isCanvasEmpty).toHaveBeenCalledTimes(1);
        });

        test('with non-empty canvas', () => {
          checkWebGL.mockReturnValue(true);
          isCanvasEmpty.mockReturnValue(false);

          const { container } = render(<PathPreviewButton isDeviceConnected />);

          fireEvent.click(container.querySelector('div[class*="button"]'));
          expect(isCanvasEmpty).toHaveBeenCalledTimes(1);
          expect(clearSelection).toHaveBeenCalledTimes(1);
          expect(useCanvasStore.getState().mode).toBe(CanvasMode.PathPreview);
        });
      });
    });
  });
});
