/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/first */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { CanvasContext } from 'app/contexts/CanvasContext';
import { CanvasMode } from 'app/constants/canvasMode';

jest.mock('helpers/useI18n', () => () => ({
  topbar: {
    task_preview: 'task_preview',
  },
}));

const checkWebGL = jest.fn();
jest.mock('helpers/check-webgl', () => checkWebGL);

const getSVGAsync = jest.fn();
jest.mock('helpers/svg-editor-helper', () => ({
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

jest.mock('app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext({
    mode: 1,
  }),
  CanvasMode: {
    Draw: 1,
    Preview: 2,
    PathPreview: 3,
  },
}));

import PathPreviewButton from './PathPreviewButton';

const mockUseWorkarea = jest.fn();
jest.mock('helpers/hooks/useWorkarea', () => () => mockUseWorkarea());

describe('test PathPreviewButton', () => {
  test('no WebGL', () => {
    checkWebGL.mockReturnValue(false);
    const { container } = render(
      <CanvasContext.Provider value={{ mode: CanvasMode.PathPreview } as any}>
        <PathPreviewButton isDeviceConnected togglePathPreview={jest.fn()} />
      </CanvasContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  describe('workarea is Ador', () => {
    it('should not render', () => {
      mockUseWorkarea.mockReturnValue('ado1');
      const { container } = render(
        <CanvasContext.Provider value={{ mode: CanvasMode.PathPreview } as any}>
          <PathPreviewButton isDeviceConnected togglePathPreview={jest.fn()} />
        </CanvasContext.Provider>
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('has WebGL', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      checkWebGL.mockReturnValue(true);
    });

    test('no devices connected in web version', () => {
      window.FLUX.version = 'web';
      checkWebGL.mockReturnValue(true);
      const { container } = render(
        <CanvasContext.Provider value={{ mode: CanvasMode.PathPreview } as any}>
          <PathPreviewButton isDeviceConnected={false} togglePathPreview={jest.fn()} />
        </CanvasContext.Provider>
      );
      expect(container).toMatchSnapshot();
    });

    test('no devices connected in desktop version', () => {
      window.FLUX.version = '1.2.3';
      const { container } = render(
        <CanvasContext.Provider value={{ mode: CanvasMode.PathPreview } as any}>
          <PathPreviewButton isDeviceConnected={false} togglePathPreview={jest.fn()} />
        </CanvasContext.Provider>
      );
      expect(container).toMatchSnapshot();
    });

    describe('has devices connected', () => {
      beforeEach(() => {
        jest.resetAllMocks();
      });

      test('is path previewing', () => {
        checkWebGL.mockReturnValue(true);
        const togglePathPreview = jest.fn();
        const { container } = render(
          <CanvasContext.Provider value={{ mode: CanvasMode.PathPreview } as any}>
            <PathPreviewButton isDeviceConnected togglePathPreview={togglePathPreview} />
          </CanvasContext.Provider>
        );

        fireEvent.click(container.querySelector('div[class*="button"]'));
        expect(clearSelection).not.toHaveBeenCalled();
        expect(togglePathPreview).not.toHaveBeenCalled();
      });

      test('is not path previewing', () => {
        checkWebGL.mockReturnValue(true);
        const togglePathPreview = jest.fn();
        const { container } = render(
          <CanvasContext.Provider value={{ mode: CanvasMode.Draw } as any}>
            <PathPreviewButton isDeviceConnected togglePathPreview={togglePathPreview} />
          </CanvasContext.Provider>
        );
        fireEvent.click(container.querySelector('div[class*="button"]'));
        expect(clearSelection).toHaveBeenCalledTimes(1);
        expect(togglePathPreview).toHaveBeenCalledTimes(1);
      });
    });
  });
});
