import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import ConfigPanelContext from './ConfigPanelContext';

let batchCmd = { count: 0, onAfter: undefined };
const mockBatchCommand = jest.fn().mockImplementation(() => {
  batchCmd = { count: batchCmd.count + 1, onAfter: undefined };

  return batchCmd;
});

jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: mockBatchCommand,
}));

import HalftoneBlock from './HalftoneBlock';

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) =>
    callback({
      Canvas: {
        addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
      },
    }),
}));

const mockWriteData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  CUSTOM_PRESET_CONSTANT: 'CUSTOM_PRESET_CONSTANT',
  writeData: (...args) => mockWriteData(...args),
}));

jest.mock('@core/helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      laser_panel: {
        halftone: 'Halftone',
        halftone_link: 'halftone_link',
      },
    },
  },
}));

const mockOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: (...args) => mockOpen(...args),
}));

const mockSelectedLayers = ['layer1', 'layer2'];
const mockContextState = {
  halftone: { hasMultiValue: false, value: 1 },
};
const mockDispatch = jest.fn();
const mockInitState = jest.fn();

jest.mock('@core/app/widgets/AntdSelect', () => {
  const Select = ({ children, className, onChange, value }: any) => (
    <select className={className} onChange={(e) => onChange(Number(e.target.value))} value={value}>
      {children}
    </select>
  );
  const Option = ({ label, value }: any) => <option value={value}>{label}</option>;

  Select.Option = Option;

  return Select;
});

describe('test HalftoneBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    batchCmd = { count: 0, onAfter: undefined };
  });

  it('should render correctly', () => {
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <HalftoneBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when type is panel-item', () => {
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <HalftoneBlock type="panel-item" />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when type is modal', () => {
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <HalftoneBlock type="modal" />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should change halftone value', () => {
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <HalftoneBlock />
      </ConfigPanelContext.Provider>,
    );
    const select = container.querySelector('select');

    fireEvent.change(select, { target: { value: '2' } });
    expect(mockDispatch).toBeCalledTimes(1);
    expect(mockDispatch).toHaveBeenNthCalledWith(1, { payload: { halftone: 2 }, type: 'change' });
    expect(mockBatchCommand).toBeCalledTimes(1);
    expect(mockBatchCommand).lastCalledWith('Change Halftone');
    expect(mockWriteData).toBeCalledTimes(2);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'halftone', 2, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(2, 'layer2', 'halftone', 2, { batchCmd });
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
    expect(mockAddCommandToHistory).lastCalledWith(batchCmd);

    const img = container.querySelector('[aria-label="question-circle"]');

    expect(mockOpen).not.toBeCalled();
    fireEvent.click(img);
    expect(mockOpen).toBeCalledTimes(1);
    expect(mockOpen).lastCalledWith('halftone_link');
  });
});
