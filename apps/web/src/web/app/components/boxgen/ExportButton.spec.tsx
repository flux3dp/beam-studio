import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';

import { BoxgenContext } from 'app/contexts/BoxgenContext';

import ExportButton from './ExportButton';

jest.mock('helpers/useI18n', () => () => ({
  boxgen: {
    continue_import: 'Continue to Import',
    import: 'Import',
    cancel: 'Cancel',
    customize: 'Customize',
    merge: 'Merge',
    text_label: 'Label',
    beam_radius: 'Kerf compensation',
    beam_radius_warning:
      'Remove Kerf compensation when the edges or joints of the box are short to ensure box assembly',
  },
}));

jest.mock('app/contexts/BoxgenContext', () => ({
  BoxgenContext: React.createContext(null),
}));

const mockGetLayouts = jest.fn();
jest.mock('helpers/boxgen/Layout', () => ({ getLayouts: (...args) => mockGetLayouts(...args) }));

const mockWrapSVG = jest.fn().mockReturnValue('mock-svg');
jest.mock(
  'helpers/boxgen/wrapSVG',
  () =>
    (...args) =>
      mockWrapSVG(...args)
);

const mockImportSvgString = jest.fn().mockResolvedValue('mock-svg-object');
jest.mock(
  'app/svgedit/operations/import/importSvgString',
  () =>
    (...args) =>
      mockImportSvgString(...args)
);

const mockAddCommandToHistory = jest.fn();
const mockDisassembleUse2Group = jest.fn();
const mockSetLayerVisibility = jest.fn();
jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) =>
    callback({
      Canvas: {
        getCurrentDrawing: () => ({
          all_layers: [{ name_: 'Box 1' }, { name_: 'Box 2-1' }],
          setLayerVisibility: (...args) => mockSetLayerVisibility(...args),
        }),
        addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
        disassembleUse2Group: (...args) => mockDisassembleUse2Group(...args),
      },
    }),
}));

const mockBatchCommand = { addSubCommand: jest.fn() };
const mockCreateBatchCommand = jest.fn().mockImplementation(() => mockBatchCommand);
jest.mock('app/svgedit/history/HistoryCommandFactory', () => ({
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
            onClose: mockOnClose,
            boxData: mockData,
            workarea: { value: 'fbm1', label: 'beamo', canvasWidth: 300, canvasHeight: 210 },
            lengthUnit: { unit: 'mm', unitRatio: 1, decimal: 0 },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any
        }
      >
        <ExportButton />
      </BoxgenContext.Provider>
    );
    expect(container).toMatchSnapshot();

    mockGetLayouts
      .mockReturnValueOnce({
        pages: [
          { shape: ['layer1-1', 'layer1-2'], label: [] },
          { shape: ['layer2'], label: [] },
        ],
      })
      .mockReturnValue({
        pages: [
          { shape: ['layer1-1', 'layer1-2'], label: ['layer1-1 label', 'layer1-2 label'] },
          { shape: ['layer2'], label: ['layer2 label'] },
        ],
      });
    const button = container.querySelector('button');
    fireEvent.click(button);

    const modal = baseElement.querySelector('.ant-modal-root');
    waitFor(() => expect(modal).toBeInTheDocument());
    expect(baseElement).toMatchSnapshot();
    expect(mockGetLayouts).toBeCalledTimes(1);
    expect(mockGetLayouts).toBeCalledWith(300, 210, mockData, {
      joinOutput: false,
      textLabel: false,
      compRadius: 0.1,
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
    expect(mockGetLayouts).toBeCalledTimes(3);
    expect(mockGetLayouts).toHaveBeenLastCalledWith(300, 210, mockData, {
      joinOutput: true,
      textLabel: false,
      compRadius: 0.1,
    });
    expect(optionButtons[0].getAttribute('aria-checked')).toBe('true');
    expect(paginationButtons[0]).toHaveClass('ant-pagination-item-active');
    expect(paginationButtons[1]).not.toHaveClass('ant-pagination-item-active');
    fireEvent.click(optionButtons[1]);
    expect(mockGetLayouts).toBeCalledTimes(4);
    expect(mockGetLayouts).toHaveBeenLastCalledWith(300, 210, mockData, {
      joinOutput: true,
      textLabel: true,
      compRadius: 0.1,
    });

    fireEvent.click(modal.querySelector('.ant-btn-primary'));
    await waitFor(() => expect(mockOnClose).toBeCalledTimes(1));
    expect(mockCreateBatchCommand).toBeCalledTimes(1);
    expect(mockWrapSVG).toBeCalledTimes(4);
    expect(mockWrapSVG).toHaveBeenNthCalledWith(1, 300, 210, ['layer1-1', 'layer1-2']);
    expect(mockWrapSVG).toHaveBeenNthCalledWith(2, 300, 210, ['layer1-1 label', 'layer1-2 label']);
    expect(mockWrapSVG).toHaveBeenNthCalledWith(3, 300, 210, ['layer2']);
    expect(mockWrapSVG).toHaveBeenNthCalledWith(4, 300, 210, ['layer2 label']);
    expect(mockImportSvgString).toBeCalledTimes(4);
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
    expect(mockDisassembleUse2Group).toBeCalledTimes(1);
    expect(mockDisassembleUse2Group).toHaveBeenNthCalledWith(
      1,
      ['mock-svg-object', 'mock-svg-object', 'mock-svg-object', 'mock-svg-object'],
      true,
      false,
      false
    );
    expect(mockSetLayerVisibility).toBeCalledTimes(2);
    expect(mockSetLayerVisibility).toHaveBeenNthCalledWith(1, 'Box 3-2', false);
    expect(mockSetLayerVisibility).toHaveBeenNthCalledWith(2, 'Box 3-2 Label', false);
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
  });
});
