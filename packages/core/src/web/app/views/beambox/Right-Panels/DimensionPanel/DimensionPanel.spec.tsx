/* eslint-disable import/first */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

const get = jest.fn();
jest.mock('implementations/storage', () => ({
  get,
}));

const mockReRenderImageSymbol = jest.fn();
const reRenderImageSymbolArray = jest.fn();
jest.mock('helpers/symbol-maker', () => ({
  reRenderImageSymbol: mockReRenderImageSymbol,
  reRenderImageSymbolArray,
}));

import DimensionPanel from './DimensionPanel';

const mockChangeSelectedAttribute = jest.fn();
const mockSetSvgElemPosition = jest.fn();
const mockSetRotationAngle = jest.fn();
const mockBeginUndoableChange = jest.fn();
const mockChangeSelectedAttributeNoUndo = jest.fn();
const mockFinishUndoableChange = jest.fn();
const setSvgElemSize = jest.fn();
const mockAddCommandToHistory = jest.fn();
const flipSelectedElements = jest.fn();
jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) => {
    callback({
      Canvas: {
        changeSelectedAttribute: (...args) => mockChangeSelectedAttribute(...args),
        setSvgElemPosition: (...args) => mockSetSvgElemPosition(...args),
        setRotationAngle: (...args) => mockSetRotationAngle(...args),
        undoMgr: {
          beginUndoableChange: (...args) => mockBeginUndoableChange(...args),
          finishUndoableChange: (...args) => mockFinishUndoableChange(...args),
          addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
        },
        changeSelectedAttributeNoUndo: (...args) => mockChangeSelectedAttributeNoUndo(...args),
        setSvgElemSize: (...args) => setSvgElemSize(...args),
        flipSelectedElements: (...args) => flipSelectedElements(...args),
      },
    });
  },
}));

jest.mock('./FlipButtons', () => () => <div>Mock FlipButtons</div>);

jest.mock('./PositionInput', () => ({ type, value, onChange }: any) => (
  <div>
    <div>Mock PositionInput</div>
    <div>type: {type}</div>
    <p>value: {value}</p>
    <button id={`position-${type}`} type="button" onClick={() => onChange(type, 100)}>
      position-{type}
    </button>
  </div>
));

jest.mock('./SizeInput', () => ({ type, value, onChange, onBlur }: any) => (
  <div>
    <div>Mock SizeInput</div>
    <div>type: {type}</div>
    <p>value: {value}</p>
    <input
      id={`size-${type}`}
      onBlur={onBlur}
      onChange={() => onChange(type === 'w' ? 'width' : 'height', 100)}
    />
  </div>
));

jest.mock('./Rotation', () => ({ value, onChange }: any) => (
  <div>
    <div>Mock Rotation</div>
    <p>value: {value}</p>
    <button type="button" onClick={() => onChange(1000)}>
      rotation
    </button>
  </div>
));

jest.mock('./RatioLock', () => ({ isLocked, onClick }: any) => (
  <div>
    <div>Mock RatioLock</div>
    <p>isLocked: {isLocked ? 'true' : 'false'}</p>
    <button type="button" onClick={onClick}>
      lock
    </button>
  </div>
));

const isMobile = jest.fn();
const mockUseIsMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
  isMobile: () => isMobile(),
  useIsMobile: () => mockUseIsMobile(),
}));

const mockForceUpdate = jest.fn();
jest.mock('helpers/use-force-update', () => () => mockForceUpdate);

const mockCreateBatchCommand = jest.fn();
jest.mock('app/svgedit/history/HistoryCommandFactory', () => ({
  createBatchCommand: (...args) => mockCreateBatchCommand(...args),
}));

const mockGetDimensionValues = jest.fn();
const mockUpdateDimensionValues = jest.fn();

const mockImage = {
  tagName: 'image',
  setAttribute: jest.fn(),
  getAttribute: jest.fn(),
};

describe('test DimensionPanel', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('no elements', () => {
    const { container } = render(
      <DimensionPanel
        elem={null}
        getDimensionValues={mockGetDimensionValues}
        updateDimensionValues={mockUpdateDimensionValues}
      />
    );
    expect(container).toMatchSnapshot();
  });

  test('unsupported element', () => {
    document.body.innerHTML = '<unsupported id="svg_1" />';
    const { container } = render(
      <DimensionPanel
        elem={document.getElementById('svg_1')}
        getDimensionValues={mockGetDimensionValues}
        updateDimensionValues={mockUpdateDimensionValues}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('shoud render correctly on desktop', () => {
    mockGetDimensionValues.mockImplementation((response) => {
      response.dimensionValues = {
        isRatioFixed: true,
        x: 1,
        y: 2,
        width: 3,
        height: 4,
        rotation: 0,
      };
    });
    const { container } = render(
      <DimensionPanel
        elem={mockImage as unknown as Element}
        getDimensionValues={mockGetDimensionValues}
        updateDimensionValues={mockUpdateDimensionValues}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('shoud render correctly on mobile', () => {
    mockGetDimensionValues.mockImplementation((response) => {
      response.dimensionValues = {
        isRatioFixed: true,
        x: 1,
        y: 2,
        width: 3,
        height: 4,
        rotation: 0,
      };
    });
    const { container } = render(
      <DimensionPanel
        elem={mockImage as unknown as Element}
        getDimensionValues={mockGetDimensionValues}
        updateDimensionValues={mockUpdateDimensionValues}
      />
    );
    expect(container).toMatchSnapshot();
  });

  test('change position', () => {
    mockGetDimensionValues.mockImplementation((response) => {
      response.dimensionValues = {
        isRatioFixed: true,
        x: 0,
        y: 0,
        width: 1080,
        height: 1526,
        rotation: 0,
      };
    });
    const { getByText } = render(
      <DimensionPanel
        elem={mockImage as unknown as Element}
        getDimensionValues={mockGetDimensionValues}
        updateDimensionValues={mockUpdateDimensionValues}
      />
    );
    expect(mockGetDimensionValues).toHaveBeenCalledTimes(1);

    fireEvent.click(getByText('position-x'));
    expect(mockChangeSelectedAttribute).toHaveBeenCalledTimes(1);
    expect(mockChangeSelectedAttribute).toHaveBeenNthCalledWith(1, 'x', 1000, [mockImage]);
    expect(mockSetSvgElemPosition).not.toHaveBeenCalled();
    expect(mockUpdateDimensionValues).toHaveBeenCalledTimes(1);
    expect(mockUpdateDimensionValues).toHaveBeenNthCalledWith(1, {
      x: 1000,
    });
    expect(mockForceUpdate).toHaveBeenCalledTimes(1);

    jest.resetAllMocks();

    fireEvent.click(getByText('position-y'));
    expect(mockChangeSelectedAttribute).toHaveBeenCalledTimes(1);
    expect(mockChangeSelectedAttribute).toHaveBeenNthCalledWith(1, 'y', 1000, [mockImage]);
    expect(mockSetSvgElemPosition).not.toHaveBeenCalled();
    expect(mockUpdateDimensionValues).toHaveBeenCalledTimes(1);
    expect(mockUpdateDimensionValues).toHaveBeenNthCalledWith(1, {
      y: 1000,
    });
    expect(mockForceUpdate).toHaveBeenCalledTimes(1);
  });

  test('change rotation', () => {
    mockGetDimensionValues.mockImplementation((response) => {
      response.dimensionValues = {
        isRatioFixed: true,
        x: 0,
        y: 0,
        width: 200,
        height: 300,
        rotation: 0,
      };
    });
    const { getByText } = render(
      <DimensionPanel
        elem={mockImage as unknown as Element}
        getDimensionValues={mockGetDimensionValues}
        updateDimensionValues={mockUpdateDimensionValues}
      />
    );
    expect(mockSetRotationAngle).not.toHaveBeenCalled();
    fireEvent.click(getByText('rotation'));
    expect(mockSetRotationAngle).toHaveBeenCalledTimes(1);
    expect(mockSetRotationAngle).toHaveBeenNthCalledWith(1, -80, false, mockImage);
    expect(mockForceUpdate).toHaveBeenCalledTimes(1);
  });

  test('change toggle ratio lock', () => {
    mockGetDimensionValues.mockImplementation((response) => {
      response.dimensionValues = {
        isRatioFixed: true,
        x: 0,
        y: 0,
        width: 200,
        height: 300,
        rotation: 0,
      };
    });
    const { getByText } = render(
      <DimensionPanel
        elem={mockImage as unknown as Element}
        getDimensionValues={mockGetDimensionValues}
        updateDimensionValues={mockUpdateDimensionValues}
      />
    );
    expect(mockChangeSelectedAttribute).not.toHaveBeenCalled();
    mockImage.getAttribute.mockReturnValueOnce('true');
    fireEvent.click(getByText('lock'));
    expect(mockImage.getAttribute).toHaveBeenCalledTimes(1);
    expect(mockImage.getAttribute).toHaveBeenNthCalledWith(1, 'data-ratiofixed');
    expect(mockChangeSelectedAttribute).toHaveBeenCalledTimes(1);
    expect(mockChangeSelectedAttribute).toHaveBeenNthCalledWith(1, 'data-ratiofixed', 'false', [
      mockImage,
    ]);
    expect(mockUpdateDimensionValues).toHaveBeenCalledTimes(1);
    expect(mockUpdateDimensionValues).toHaveBeenNthCalledWith(1, {
      isRatioFixed: false,
    });
  });

  test('change size', () => {
    mockGetDimensionValues.mockImplementation((response) => {
      response.dimensionValues = {
        isRatioFixed: true,
        x: 0,
        y: 0,
        width: 200,
        height: 300,
        rotation: 0,
      };
    });
    const { container } = render(
      <DimensionPanel
        elem={mockImage as unknown as Element}
        getDimensionValues={mockGetDimensionValues}
        updateDimensionValues={mockUpdateDimensionValues}
      />
    );
    const inputW = container.querySelector('#size-w');
    expect(mockBeginUndoableChange).not.toBeCalled();
    expect(mockChangeSelectedAttributeNoUndo).not.toBeCalled();
    expect(mockFinishUndoableChange).not.toBeCalled();
    const mockCmd = { isEmpty: () => false };
    mockFinishUndoableChange.mockReturnValue(mockCmd);
    const addSubCommand = jest.fn();
    const isEmpty = jest.fn();
    mockCreateBatchCommand.mockReturnValue({
      addSubCommand,
      isEmpty,
    });
    fireEvent.change(inputW, { target: { value: '100' } });
    expect(mockBeginUndoableChange).toHaveBeenCalledTimes(2);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(1, 'width', [mockImage]);
    expect(mockBeginUndoableChange).toHaveBeenNthCalledWith(2, 'height', [mockImage]);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenCalledTimes(2);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(1, 'width', 1000, [
      mockImage,
    ]);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(2, 'height', 1500, [
      mockImage,
    ]);
    expect(mockFinishUndoableChange).toBeCalledTimes(2);
    expect(mockCreateBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockCreateBatchCommand).toHaveBeenNthCalledWith(1, 'Object Panel Size Change');
    expect(addSubCommand).toHaveBeenCalledTimes(2);
    expect(mockUpdateDimensionValues).toBeCalledTimes(1);
    expect(mockUpdateDimensionValues).toHaveBeenLastCalledWith({ width: 1000, height: 1500 });
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
    expect(mockForceUpdate).toBeCalledTimes(1);
    expect(mockReRenderImageSymbol).not.toBeCalled();
  });

  test('rerender image symbol', () => {
    mockGetDimensionValues.mockImplementation((response) => {
      response.dimensionValues = {
        isRatioFixed: true,
        x: 0,
        y: 0,
        width: 200,
        height: 300,
        rotation: 0,
      };
    });
    const mockElem = {
      tagName: 'use',
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
    };
    const { container } = render(
      <DimensionPanel
        elem={mockElem as unknown as Element}
        getDimensionValues={mockGetDimensionValues}
        updateDimensionValues={mockUpdateDimensionValues}
      />
    );
    const inputW = container.querySelector('#size-w');
    fireEvent.blur(inputW);
    expect(mockReRenderImageSymbol).toBeCalledTimes(1);
    expect(mockReRenderImageSymbol).toHaveBeenLastCalledWith(mockElem);
  });
});
