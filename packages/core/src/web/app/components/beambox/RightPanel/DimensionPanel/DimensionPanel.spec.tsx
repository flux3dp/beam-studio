import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const get = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get: () => get(),
}));

const mockReRenderImageSymbol = jest.fn();

jest.mock('@core/helpers/symbol-helper/symbolMaker', () => ({
  reRenderImageSymbol: (...args) => mockReRenderImageSymbol(...args),
}));

import DimensionPanel from './DimensionPanel';
import { ObjectPanelContext } from '../contexts/ObjectPanelContext';

const mockChangeSelectedAttribute = jest.fn();
const mockSetSvgElemPosition = jest.fn();
const mockSetRotationAngle = jest.fn();
const mockBeginUndoableChange = jest.fn();
const mockChangeSelectedAttributeNoUndo = jest.fn();
const mockFinishUndoableChange = jest.fn();
const setSvgElemSize = jest.fn();
const mockAddCommandToHistory = jest.fn();
const flipSelectedElements = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) => {
    callback({
      Canvas: {
        changeSelectedAttribute: (...args) => mockChangeSelectedAttribute(...args),
        changeSelectedAttributeNoUndo: (...args) => mockChangeSelectedAttributeNoUndo(...args),
        flipSelectedElements: (...args) => flipSelectedElements(...args),
        setRotationAngle: (...args) => mockSetRotationAngle(...args),
        setSvgElemPosition: (...args) => mockSetSvgElemPosition(...args),
        setSvgElemSize: (...args) => setSvgElemSize(...args),
        undoMgr: {
          addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
          beginUndoableChange: (...args) => mockBeginUndoableChange(...args),
          finishUndoableChange: (...args) => mockFinishUndoableChange(...args),
        },
      },
    });
  },
}));

jest.mock('./FlipButtons', () => () => <div>Mock FlipButtons</div>);

jest.mock('./PositionInput', () => ({ onChange, type, value }: any) => (
  <div>
    <div>Mock PositionInput</div>
    <div>type: {type}</div>
    <p>value: {value}</p>
    <button id={`position-${type}`} onClick={() => onChange(type, 100)} type="button">
      position-{type}
    </button>
  </div>
));

jest.mock('./SizeInput', () => ({ onBlur, onChange, type, value }: any) => (
  <div>
    <div>Mock SizeInput</div>
    <div>type: {type}</div>
    <p>value: {value}</p>
    <input id={`size-${type}`} onBlur={onBlur} onChange={() => onChange(type === 'w' ? 'width' : 'height', 100)} />
  </div>
));

jest.mock('./Rotation', () => ({ onChange, value }: any) => (
  <div>
    <div>Mock Rotation</div>
    <p>value: {value}</p>
    <button onClick={() => onChange(1000)} type="button">
      rotation
    </button>
  </div>
));

jest.mock('./RatioLock', () => ({ isLocked, onClick }: any) => (
  <div>
    <div>Mock RatioLock</div>
    <p>isLocked: {isLocked ? 'true' : 'false'}</p>
    <button onClick={onClick} type="button">
      lock
    </button>
  </div>
));

const mockUseIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

const mockForceUpdate = jest.fn();

jest.mock('@core/helpers/use-force-update', () => () => mockForceUpdate);

const mockCreateBatchCommand = jest.fn();

jest.mock('@core/app/svgedit/history/HistoryCommandFactory', () => ({
  createBatchCommand: (...args) => mockCreateBatchCommand(...args),
}));

jest.mock('../ObjectPanelItem');

const mockGetDimensionValues = jest.fn();
const mockUpdateDimensionValues = jest.fn();

const mockImage = {
  getAttribute: jest.fn(),
  setAttribute: jest.fn(),
  tagName: 'image',
};

const renderDimensionPanel = (elem: any) => {
  return render(
    <ObjectPanelContext.Provider
      value={{ getDimensionValues: mockGetDimensionValues, updateDimensionValues: mockUpdateDimensionValues } as any}
    >
      <DimensionPanel elem={elem} />
    </ObjectPanelContext.Provider>,
  );
};

describe('test DimensionPanel', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('no elements', () => {
    const { container } = renderDimensionPanel(null);

    expect(container).toMatchSnapshot();
  });

  test('unsupported element', () => {
    document.body.innerHTML = '<unsupported id="svg_1" />';

    const { container } = renderDimensionPanel(document.getElementById('svg_1'));

    expect(container).toMatchSnapshot();
  });

  it('shoud render correctly on desktop', () => {
    mockGetDimensionValues.mockImplementation((response) => {
      response.dimensionValues = {
        height: 4,
        isRatioFixed: true,
        rotation: 0,
        width: 3,
        x: 1,
        y: 2,
      };
    });

    const { container } = renderDimensionPanel(mockImage);

    expect(container).toMatchSnapshot();
  });

  it('shoud render correctly on mobile', () => {
    mockGetDimensionValues.mockImplementation((response) => {
      response.dimensionValues = {
        height: 4,
        isRatioFixed: true,
        rotation: 0,
        width: 3,
        x: 1,
        y: 2,
      };
    });

    const { container } = renderDimensionPanel(mockImage);

    expect(container).toMatchSnapshot();
  });

  test('change position', () => {
    mockGetDimensionValues.mockImplementation((response) => {
      response.dimensionValues = {
        height: 1526,
        isRatioFixed: true,
        rotation: 0,
        width: 1080,
        x: 0,
        y: 0,
      };
    });

    const { getByText } = renderDimensionPanel(mockImage);

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
        height: 300,
        isRatioFixed: true,
        rotation: 0,
        width: 200,
        x: 0,
        y: 0,
      };
    });

    const { getByText } = renderDimensionPanel(mockImage);

    expect(mockSetRotationAngle).not.toHaveBeenCalled();
    fireEvent.click(getByText('rotation'));
    expect(mockSetRotationAngle).toHaveBeenCalledTimes(1);
    expect(mockSetRotationAngle).toHaveBeenNthCalledWith(1, -80, false, mockImage);
    expect(mockForceUpdate).toHaveBeenCalledTimes(1);
  });

  test('change toggle ratio lock', () => {
    mockGetDimensionValues.mockImplementation((response) => {
      response.dimensionValues = {
        height: 300,
        isRatioFixed: true,
        rotation: 0,
        width: 200,
        x: 0,
        y: 0,
      };
    });

    const { getByText } = renderDimensionPanel(mockImage);

    expect(mockChangeSelectedAttribute).not.toHaveBeenCalled();
    mockImage.getAttribute.mockReturnValueOnce('true');
    fireEvent.click(getByText('lock'));
    expect(mockImage.getAttribute).toHaveBeenCalledTimes(1);
    expect(mockImage.getAttribute).toHaveBeenNthCalledWith(1, 'data-ratiofixed');
    expect(mockChangeSelectedAttribute).toHaveBeenCalledTimes(1);
    expect(mockChangeSelectedAttribute).toHaveBeenNthCalledWith(1, 'data-ratiofixed', 'false', [mockImage]);
    expect(mockUpdateDimensionValues).toHaveBeenCalledTimes(1);
    expect(mockUpdateDimensionValues).toHaveBeenNthCalledWith(1, {
      isRatioFixed: false,
    });
  });

  test('change size', () => {
    mockGetDimensionValues.mockImplementation((response) => {
      response.dimensionValues = {
        height: 300,
        isRatioFixed: true,
        rotation: 0,
        width: 200,
        x: 0,
        y: 0,
      };
    });

    const { container } = renderDimensionPanel(mockImage);
    const inputW = container.querySelector('#size-w');

    expect(mockBeginUndoableChange).not.toHaveBeenCalled();
    expect(mockChangeSelectedAttributeNoUndo).not.toHaveBeenCalled();
    expect(mockFinishUndoableChange).not.toHaveBeenCalled();

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
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(1, 'width', 1000, [mockImage]);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(2, 'height', 1500, [mockImage]);
    expect(mockFinishUndoableChange).toHaveBeenCalledTimes(2);
    expect(mockCreateBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockCreateBatchCommand).toHaveBeenNthCalledWith(1, 'Object Panel Size Change');
    expect(addSubCommand).toHaveBeenCalledTimes(2);
    expect(mockUpdateDimensionValues).toHaveBeenCalledTimes(1);
    expect(mockUpdateDimensionValues).toHaveBeenLastCalledWith({ height: 1500, width: 1000 });
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockForceUpdate).toHaveBeenCalledTimes(1);
    expect(mockReRenderImageSymbol).not.toHaveBeenCalled();
  });

  test('rerender image symbol', () => {
    mockGetDimensionValues.mockImplementation((response) => {
      response.dimensionValues = {
        height: 300,
        isRatioFixed: true,
        rotation: 0,
        width: 200,
        x: 0,
        y: 0,
      };
    });

    const mockElem = {
      getAttribute: jest.fn(),
      setAttribute: jest.fn(),
      tagName: 'use',
    };
    const { container } = renderDimensionPanel(mockElem);
    const inputW = container.querySelector('#size-w');

    fireEvent.blur(inputW);
    expect(mockReRenderImageSymbol).toHaveBeenCalledTimes(1);
    expect(mockReRenderImageSymbol).toHaveBeenLastCalledWith(mockElem);
  });
});

describe('test DimensionPanel in mobile', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseIsMobile.mockReturnValue(true);
  });

  test('no elements', () => {
    const { container } = renderDimensionPanel(null);

    expect(container).toMatchSnapshot();
  });

  test('unsupported element', () => {
    document.body.innerHTML = '<unsupported id="svg_1" />';

    const { container } = renderDimensionPanel(document.getElementById('svg_1'));

    expect(container).toMatchSnapshot();
  });

  it('shoud render correctly on desktop', () => {
    mockGetDimensionValues.mockImplementation((response) => {
      response.dimensionValues = {
        height: 4,
        isRatioFixed: true,
        rotation: 0,
        width: 3,
        x: 1,
        y: 2,
      };
    });

    const { container } = renderDimensionPanel(mockImage);

    expect(container).toMatchSnapshot();
  });

  it('shoud render correctly on mobile', () => {
    mockGetDimensionValues.mockImplementation((response) => {
      response.dimensionValues = {
        height: 4,
        isRatioFixed: true,
        rotation: 0,
        width: 3,
        x: 1,
        y: 2,
      };
    });

    const { container } = renderDimensionPanel(mockImage);

    expect(container).toMatchSnapshot();
  });

  test('change position', () => {
    mockGetDimensionValues.mockImplementation((response) => {
      response.dimensionValues = {
        height: 1526,
        isRatioFixed: true,
        rotation: 0,
        width: 1080,
        x: 0,
        y: 0,
      };
    });

    const { getByText } = renderDimensionPanel(mockImage);

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
        height: 300,
        isRatioFixed: true,
        rotation: 0,
        width: 200,
        x: 0,
        y: 0,
      };
    });

    const { getByText } = renderDimensionPanel(mockImage);

    expect(mockSetRotationAngle).not.toHaveBeenCalled();
    fireEvent.click(getByText('rotation'));
    expect(mockSetRotationAngle).toHaveBeenCalledTimes(1);
    expect(mockSetRotationAngle).toHaveBeenNthCalledWith(1, -80, false, mockImage);
    expect(mockForceUpdate).toHaveBeenCalledTimes(1);
  });

  test('change toggle ratio lock', () => {
    mockGetDimensionValues.mockImplementation((response) => {
      response.dimensionValues = {
        height: 300,
        isRatioFixed: true,
        rotation: 0,
        width: 200,
        x: 0,
        y: 0,
      };
    });

    const { getByText } = renderDimensionPanel(mockImage);

    expect(mockChangeSelectedAttribute).not.toHaveBeenCalled();
    mockImage.getAttribute.mockReturnValueOnce('true');
    fireEvent.click(getByText('lock'));
    expect(mockImage.getAttribute).toHaveBeenCalledTimes(1);
    expect(mockImage.getAttribute).toHaveBeenNthCalledWith(1, 'data-ratiofixed');
    expect(mockChangeSelectedAttribute).toHaveBeenCalledTimes(1);
    expect(mockChangeSelectedAttribute).toHaveBeenNthCalledWith(1, 'data-ratiofixed', 'false', [mockImage]);
    expect(mockUpdateDimensionValues).toHaveBeenCalledTimes(1);
    expect(mockUpdateDimensionValues).toHaveBeenNthCalledWith(1, {
      isRatioFixed: false,
    });
  });

  test('change size', () => {
    mockGetDimensionValues.mockImplementation((response) => {
      response.dimensionValues = {
        height: 300,
        isRatioFixed: true,
        rotation: 0,
        width: 200,
        x: 0,
        y: 0,
      };
    });

    const { container } = renderDimensionPanel(mockImage);
    const inputW = container.querySelector('#size-w');

    expect(mockBeginUndoableChange).not.toHaveBeenCalled();
    expect(mockChangeSelectedAttributeNoUndo).not.toHaveBeenCalled();
    expect(mockFinishUndoableChange).not.toHaveBeenCalled();

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
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(1, 'width', 1000, [mockImage]);
    expect(mockChangeSelectedAttributeNoUndo).toHaveBeenNthCalledWith(2, 'height', 1500, [mockImage]);
    expect(mockFinishUndoableChange).toHaveBeenCalledTimes(2);
    expect(mockCreateBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockCreateBatchCommand).toHaveBeenNthCalledWith(1, 'Object Panel Size Change');
    expect(addSubCommand).toHaveBeenCalledTimes(2);
    expect(mockUpdateDimensionValues).toHaveBeenCalledTimes(1);
    expect(mockUpdateDimensionValues).toHaveBeenLastCalledWith({ height: 1500, width: 1000 });
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockForceUpdate).toHaveBeenCalledTimes(1);
    expect(mockReRenderImageSymbol).not.toHaveBeenCalled();
  });

  test('rerender image symbol', () => {
    mockGetDimensionValues.mockImplementation((response) => {
      response.dimensionValues = {
        height: 300,
        isRatioFixed: true,
        rotation: 0,
        width: 200,
        x: 0,
        y: 0,
      };
    });

    const mockElem = {
      getAttribute: jest.fn(),
      setAttribute: jest.fn(),
      tagName: 'use',
    };
    const { container } = renderDimensionPanel(mockElem);
    const inputW = container.querySelector('#size-w');

    fireEvent.blur(inputW);
    expect(mockReRenderImageSymbol).toHaveBeenCalledTimes(1);
    expect(mockReRenderImageSymbol).toHaveBeenLastCalledWith(mockElem);
  });
});
