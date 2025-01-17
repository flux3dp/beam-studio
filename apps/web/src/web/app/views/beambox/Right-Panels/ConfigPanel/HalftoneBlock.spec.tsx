/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import ConfigPanelContext from './ConfigPanelContext';

let batchCmd = { onAfter: undefined, count: 0 };
const mockBatchCommand = jest.fn().mockImplementation(() => {
  batchCmd = { onAfter: undefined, count: batchCmd.count + 1 };
  return batchCmd;
});
jest.mock('app/svgedit/history/history', () => ({
  BatchCommand: mockBatchCommand,
}));

// eslint-disable-next-line import/first
import HalftoneBlock from './HalftoneBlock';

const mockAddCommandToHistory = jest.fn();
jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) =>
    callback({
      Canvas: {
        addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
      },
    }),
}));

const mockWriteData = jest.fn();
jest.mock('helpers/layer/layer-config-helper', () => ({
  CUSTOM_PRESET_CONSTANT: 'CUSTOM_PRESET_CONSTANT',
  writeData: (...args) => mockWriteData(...args),
}));

jest.mock('helpers/useI18n', () => () => ({
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
jest.mock('implementations/browser', () => ({
  open: (...args) => mockOpen(...args),
}));

const mockSelectedLayers = ['layer1', 'layer2'];
const mockContextState = {
  halftone: { value: 1, hasMultiValue: false },
};
const mockDispatch = jest.fn();
const mockInitState = jest.fn();

jest.mock('app/widgets/AntdSelect', () => {
  const Select = ({ className, children, onChange, value }: any) => (
    <select className={className} onChange={(e) => onChange(Number(e.target.value))} value={value}>
      {children}
    </select>
  );
  const Option = ({ value, label }: any) => (<option value={value}>{label}</option>);
  Select.Option = Option;
  return Select;
});

describe('test HalftoneBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    batchCmd = { onAfter: undefined, count: 0 };
  });

  it('should render correctly', () => {
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          state: mockContextState as any,
          dispatch: mockDispatch,
          selectedLayers: mockSelectedLayers,
          initState: mockInitState,
        }}
      >
        <HalftoneBlock />
      </ConfigPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should render correctly when type is panel-item', () => {
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          state: mockContextState as any,
          dispatch: mockDispatch,
          selectedLayers: mockSelectedLayers,
          initState: mockInitState,
        }}
      >
        <HalftoneBlock type="panel-item" />
      </ConfigPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should render correctly when type is modal', () => {
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          state: mockContextState as any,
          dispatch: mockDispatch,
          selectedLayers: mockSelectedLayers,
          initState: mockInitState,
        }}
      >
        <HalftoneBlock type="modal" />
      </ConfigPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should change halftone value', () => {
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          state: mockContextState as any,
          dispatch: mockDispatch,
          selectedLayers: mockSelectedLayers,
          initState: mockInitState,
        }}
      >
        <HalftoneBlock />
      </ConfigPanelContext.Provider>
    );
    const select = container.querySelector('select');
    fireEvent.change(select, { target: { value: '2' } });
    expect(mockDispatch).toBeCalledTimes(1);
    expect(mockDispatch).toHaveBeenNthCalledWith(1, { type: 'change', payload: { halftone: 2 } });
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
