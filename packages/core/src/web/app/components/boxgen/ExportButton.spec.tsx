import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import { BoxgenContext } from '@core/app/contexts/BoxgenContext';

import ExportButton from './ExportButton';

jest.mock('@core/helpers/useI18n', () => () => ({
  boxgen: {
    beam_radius: 'Kerf compensation',
    beam_radius_warning:
      'Remove Kerf compensation when the edges or joints of the box are short to ensure box assembly',
    cancel: 'Cancel',
    continue_import: 'Continue to Import',
    customize: 'Customize',
    import: 'Import',
    merge: 'Merge',
    text_label: 'Label',
  },
}));

jest.mock('@core/app/contexts/BoxgenContext', () => ({
  BoxgenContext: React.createContext(null),
}));

const mockGetLayouts = jest.fn();

jest.mock('@core/helpers/boxgen/Layout', () => ({
  getLayouts: (...args) => mockGetLayouts(...args),
}));

const mockWrapSVG = jest.fn().mockReturnValue('mock-svg');

jest.mock(
  '@core/helpers/boxgen/wrapSVG',
  () =>
    (...args) =>
      mockWrapSVG(...args),
);

const mockImportSvgString = jest.fn().mockResolvedValue('mock-svg-object');

jest.mock(
  '@core/app/svgedit/operations/import/importSvgString',
  () =>
    (...args) =>
      mockImportSvgString(...args),
);

const mockSetLayerVisibility = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) =>
    callback({
      Canvas: {
        getCurrentDrawing: () => ({
          all_layers: [{ name_: 'Box 1' }, { name_: 'Box 2-1' }],
          setLayerVisibility: (...args) => mockSetLayerVisibility(...args),
        }),
      },
    }),
}));

const mockDisassembleUse = jest.fn();

jest.mock(
  '@core/app/svgedit/operations/disassembleUse',
  () =>
    (...args) =>
      mockDisassembleUse(...args),
);

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
}));

const mockBatchCommand = { addSubCommand: jest.fn() };
const mockCreateBatchCommand = jest.fn().mockImplementation(() => mockBatchCommand);

jest.mock('@core/app/svgedit/history/HistoryCommandFactory', () => ({
  createBatchCommand: (...args) => mockCreateBatchCommand(...args),
}));

const mockOnClose = jest.fn();
const mockData = {};

describe('test ExportButton', () => {
  test('should behave correctly', async () => {
    const { baseElement, container } = render(
      <BoxgenContext.Provider
        value={
          {
            boxData: mockData,
            lengthUnit: { decimal: 0, unit: 'mm', unitRatio: 1 },
            onClose: mockOnClose,
            workarea: { canvasHeight: 210, canvasWidth: 300, label: 'beamo', value: 'fbm1' },
          } as any
        }
      >
        <ExportButton />
      </BoxgenContext.Provider>,
    );

    expect(container).toMatchSnapshot();

    mockGetLayouts
      .mockReturnValueOnce({
        pages: [
          { label: [], shape: ['layer1-1', 'layer1-2'] },
          { label: [], shape: ['layer2'] },
        ],
      })
      .mockReturnValue({
        pages: [
          { label: ['layer1-1 label', 'layer1-2 label'], shape: ['layer1-1', 'layer1-2'] },
          { label: ['layer2 label'], shape: ['layer2'] },
        ],
      });

    const button = container.querySelector('button');

    fireEvent.click(button);

    const modal = baseElement.querySelector('.ant-modal-root');

    waitFor(() => expect(modal).toBeInTheDocument());
    expect(baseElement).toMatchSnapshot();
    expect(mockGetLayouts).toHaveBeenCalledTimes(1);
    expect(mockGetLayouts).toBeCalledWith(300, 210, mockData, {
      compRadius: 0.1,
      joinOutput: false,
      textLabel: false,
    });

    const paginationButtons = modal.querySelectorAll('.ant-pagination-item');

    expect(paginationButtons[0]).toHaveClass('ant-pagination-item-active');
    expect(paginationButtons[1]).not.toHaveClass('ant-pagination-item-active');
    fireEvent.click(modal.querySelector('.ant-pagination-item-2'));
    expect(modal.querySelector('.ant-modal-body svg')).toHaveTextContent('layer2');
    expect(paginationButtons[0]).not.toHaveClass('ant-pagination-item-active');
    expect(paginationButtons[1]).toHaveClass('ant-pagination-item-active');

    const optionButtons = modal.querySelectorAll('button.ant-switch');

    fireEvent.click(optionButtons[0]);
    expect(mockGetLayouts).toHaveBeenCalledTimes(3);
    expect(mockGetLayouts).toHaveBeenLastCalledWith(300, 210, mockData, {
      compRadius: 0.1,
      joinOutput: true,
      textLabel: false,
    });
    expect(optionButtons[0].getAttribute('aria-checked')).toBe('true');
    expect(paginationButtons[0]).toHaveClass('ant-pagination-item-active');
    expect(paginationButtons[1]).not.toHaveClass('ant-pagination-item-active');
    fireEvent.click(optionButtons[1]);
    expect(mockGetLayouts).toHaveBeenCalledTimes(4);
    expect(mockGetLayouts).toHaveBeenLastCalledWith(300, 210, mockData, {
      compRadius: 0.1,
      joinOutput: true,
      textLabel: true,
    });

    fireEvent.click(modal.querySelector('.ant-btn-primary'));
    await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
    expect(mockCreateBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockWrapSVG).toHaveBeenCalledTimes(4);
    expect(mockWrapSVG).toHaveBeenNthCalledWith(1, 300, 210, ['layer1-1', 'layer1-2']);
    expect(mockWrapSVG).toHaveBeenNthCalledWith(2, 300, 210, ['layer1-1 label', 'layer1-2 label']);
    expect(mockWrapSVG).toHaveBeenNthCalledWith(3, 300, 210, ['layer2']);
    expect(mockWrapSVG).toHaveBeenNthCalledWith(4, 300, 210, ['layer2 label']);
    expect(mockImportSvgString).toHaveBeenCalledTimes(4);
    expect(mockImportSvgString).toHaveBeenNthCalledWith(1, 'mock-svg', {
      layerName: 'Box 3-1',
      parentCmd: mockBatchCommand,
      type: 'layer',
    });
    expect(mockImportSvgString).toHaveBeenNthCalledWith(2, 'mock-svg', {
      layerName: 'Box 3-1 Label',
      parentCmd: mockBatchCommand,
      type: 'layer',
    });
    expect(mockImportSvgString).toHaveBeenNthCalledWith(3, 'mock-svg', {
      layerName: 'Box 3-2',
      parentCmd: mockBatchCommand,
      type: 'layer',
    });
    expect(mockImportSvgString).toHaveBeenNthCalledWith(4, 'mock-svg', {
      layerName: 'Box 3-2 Label',
      parentCmd: mockBatchCommand,
      type: 'layer',
    });
    expect(mockDisassembleUse).toHaveBeenCalledTimes(1);
    expect(mockDisassembleUse).toHaveBeenNthCalledWith(
      1,
      ['mock-svg-object', 'mock-svg-object', 'mock-svg-object', 'mock-svg-object'],
      {
        parentCmd: mockBatchCommand,
        showProgress: false,
        skipConfirm: true,
      },
    );
    expect(mockSetLayerVisibility).toHaveBeenCalledTimes(2);
    expect(mockSetLayerVisibility).toHaveBeenNthCalledWith(1, 'Box 3-2', false);
    expect(mockSetLayerVisibility).toHaveBeenNthCalledWith(2, 'Box 3-2 Label', false);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
  });
});
