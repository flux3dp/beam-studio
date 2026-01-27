import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import ExportButton from './ExportButton';

const mockData = {};

jest.mock('@core/app/stores/boxgenStore', () => ({
  useBoxgenStore: jest.fn((selector) => selector({ boxData: mockData })),
}));

jest.mock('./useBoxgenWorkarea', () => () => ({
  lengthUnit: { decimal: 2, unit: 'mm', unitRatio: 1 },
  workarea: { canvasHeight: 210, canvasWidth: 300, label: 'beamo', value: 'fbm1' },
}));

const mockGetLayouts = jest.fn();

jest.mock('@core/helpers/boxgen/Layout', () => ({
  getLayouts: (...args: unknown[]) => mockGetLayouts(...args),
}));

const mockWrapSVG = jest.fn().mockReturnValue('mock-svg');

jest.mock(
  '@core/helpers/boxgen/wrapSVG',
  () =>
    (...args: unknown[]) =>
      mockWrapSVG(...args),
);

const mockImportSvgString = jest.fn().mockResolvedValue('mock-svg-object');

jest.mock(
  '@core/app/svgedit/operations/import/importSvgString',
  () =>
    (...args: unknown[]) =>
      mockImportSvgString(...args),
);

const mockGetAllLayers = jest.fn();
const mockGetLayerByName = jest.fn();

jest.mock('@core/app/svgedit/layer/layerManager', () => ({
  getAllLayers: (...args: unknown[]) => mockGetAllLayers(...args),
  getLayerByName: (...args: unknown[]) => mockGetLayerByName(...args),
}));

const mockDisassembleUse = jest.fn();

jest.mock(
  '@core/app/svgedit/operations/disassembleUse',
  () =>
    (...args: unknown[]) =>
      mockDisassembleUse(...args),
);

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args: unknown[]) => mockAddCommandToHistory(...args),
}));

const mockBatchCommand = { addSubCommand: jest.fn() };
const mockCreateBatchCommand = jest.fn().mockImplementation(() => mockBatchCommand);

jest.mock('@core/app/svgedit/history/HistoryCommandFactory', () => ({
  createBatchCommand: (...args: unknown[]) => mockCreateBatchCommand(...args),
}));

const mockOnClose = jest.fn();

// Mock layer objects that will be returned by getLayerByName
const mockNewLayer1 = { setVisible: jest.fn() };
const mockNewLayer2 = { setVisible: jest.fn() };

describe('test ExportButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the existing layers
    const mockLayer1 = {
      getName: jest.fn().mockReturnValue('Box 1'),
      setVisible: jest.fn(),
    };
    const mockLayer2 = {
      getName: jest.fn().mockReturnValue('Box 2-1'),
      setVisible: jest.fn(),
    };

    // Reset mock return values that were cleared
    mockWrapSVG.mockReturnValue('mock-svg');
    mockImportSvgString.mockResolvedValue('mock-svg-object');
    mockCreateBatchCommand.mockImplementation(() => mockBatchCommand);
    mockGetAllLayers.mockReturnValue([mockLayer1, mockLayer2]);
    mockGetLayerByName.mockReturnValueOnce(mockNewLayer1).mockReturnValueOnce(mockNewLayer2);
  });

  test('should render correctly', () => {
    const { container } = render(<ExportButton onClose={mockOnClose} />);

    expect(container).toMatchSnapshot();
  });

  test('should behave correctly', async () => {
    const { baseElement, container } = render(<ExportButton onClose={mockOnClose} />);

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

    fireEvent.click(button!);

    const modal = baseElement.querySelector('.ant-modal-root');

    await waitFor(() => expect(modal).toBeInTheDocument());
    expect(baseElement).toMatchSnapshot();
    expect(mockGetLayouts).toHaveBeenCalledTimes(1);
    expect(mockGetLayouts).toHaveBeenCalledWith(300, 210, mockData, {
      compRadius: 0.1,
      joinOutput: false,
      textLabel: false,
    });

    const paginationButtons = modal!.querySelectorAll('.ant-pagination-item');

    expect(paginationButtons[0]).toHaveClass('ant-pagination-item-active');
    expect(paginationButtons[1]).not.toHaveClass('ant-pagination-item-active');
    fireEvent.click(modal!.querySelector('.ant-pagination-item-2')!);
    expect(modal!.querySelector('.ant-modal-body svg')).toHaveTextContent('layer2');
    expect(paginationButtons[0]).not.toHaveClass('ant-pagination-item-active');
    expect(paginationButtons[1]).toHaveClass('ant-pagination-item-active');

    const optionButtons = modal!.querySelectorAll('button.ant-switch');

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

    fireEvent.click(modal!.querySelector('.ant-btn-primary')!);
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
    expect(mockGetLayerByName).toHaveBeenCalledWith('Box 3-2');
    expect(mockGetLayerByName).toHaveBeenCalledWith('Box 3-2 Label');
    expect(mockNewLayer1.setVisible).toHaveBeenCalledTimes(1);
    expect(mockNewLayer1.setVisible).toHaveBeenCalledWith(false, { addToHistory: false });
    expect(mockNewLayer2.setVisible).toHaveBeenCalledTimes(1);
    expect(mockNewLayer2.setVisible).toHaveBeenCalledWith(false, { addToHistory: false });
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
  });
});
