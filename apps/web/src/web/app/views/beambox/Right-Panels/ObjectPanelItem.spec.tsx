/* eslint-disable import/first */
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';

const mockOnClick1 = jest.fn();
const mockOnClick2 = jest.fn();
const mockUpdateValue = jest.fn();
const mockStorage = jest.fn();
jest.mock('implementations/storage', () => ({
  get: (key) => mockStorage(key),
}));

const getSVGAsync = jest.fn();
jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync,
}));

const distHori = jest.fn();
const distVert = jest.fn();
const groupSelectedElements = jest.fn();
const ungroupSelectedElement = jest.fn();
const booleanOperationSelectedElements = jest.fn();
getSVGAsync.mockImplementation((callback) => {
  callback({
    Editor: {
      distHori,
      distVert,
      groupSelectedElements,
      ungroupSelectedElement,
      booleanOperationSelectedElements,
    },
  });
});

const mockActions = [
  { icon: <span>mock icon 1</span>, label: 'mock action 1', onClick: mockOnClick1 },
  { icon: <span>mock icon 2</span>, label: 'mock action 2', onClick: mockOnClick2, disabled: true },
];

import { ObjectPanelContextProvider } from 'app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import ObjectPanelItem from './ObjectPanelItem';

const MockNumberItem = ({ id, unit, decimal }: { id: string; unit?: string; decimal?: number }) => {
  const [value, setValue] = React.useState(1);
  return (
    <ObjectPanelContextProvider>
      <ObjectPanelItem.Mask />
      <ObjectPanelItem.Number
        id={id}
        value={value}
        max={50}
        updateValue={(val) => {
          mockUpdateValue(val);
          setValue(val);
        }}
        label="mock-label"
        unit={unit}
        decimal={decimal}
      />
    </ObjectPanelContextProvider>
  );
};

const MockSelect = ({
  options,
}: {
  options: {
    label: string | JSX.Element;
    value: string | number;
  }[];
}) => {
  const [value, setValue] = React.useState<string | number>(1);
  return (
    <ObjectPanelContextProvider>
      <ObjectPanelItem.Mask />
      <ObjectPanelItem.Select
        id="mock-select"
        selected={{ value, label: `display label ${value}` }}
        options={options}
        onChange={(val) => {
          mockUpdateValue(val);
          setValue(val);
        }}
        label="mock-label"
      />
    </ObjectPanelContextProvider>
  );
};

describe('should render correctly', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('divider', () => {
    const { container } = render(<ObjectPanelItem.Divider />);
    expect(container).toMatchSnapshot();
  });

  describe('basic item', () => {
    test('disabled', () => {
      const { container } = render(
        <ObjectPanelItem.Item
          id="mock-item"
          content={<div>mock content</div>}
          label="mock-label"
          onClick={mockOnClick1}
          disabled
        />
      );
      expect(container).toMatchSnapshot();
    });

    test('not disabled', () => {
      const { container } = render(
        <ObjectPanelContextProvider>
          <ObjectPanelItem.Item
            id="mock-item"
            content={<div>mock content</div>}
            label="mock-label"
            onClick={mockOnClick1}
          />
        </ObjectPanelContextProvider>
      );
      expect(container).toMatchSnapshot();
      expect(mockOnClick1).toBeCalledTimes(0);
      fireEvent.click(container.querySelector('div.object-panel-item'));
      expect(mockOnClick1).toBeCalledTimes(1);
      expect(container.querySelector('div.object-panel-item')).toHaveClass('active');
    });
  });

  describe('action list', () => {
    test('disabled', () => {
      const { container } = render(
        <ObjectPanelItem.ActionList
          id="mock-action-list"
          actions={mockActions}
          content={<div>mock content</div>}
          label="mock-label"
          disabled
        />
      );
      expect(container).toMatchSnapshot();
    });

    test('not disabled', async () => {
      const { baseElement, container, getByText } = render(
        <ObjectPanelContextProvider>
          <ObjectPanelItem.ActionList
            id="mock-action-list"
            actions={mockActions}
            content={<div>mock content</div>}
            label="mock-label"
          />
        </ObjectPanelContextProvider>
      );
      fireEvent.click(container.querySelector('div.object-panel-item'));
      expect(baseElement).toMatchSnapshot();
      expect(mockOnClick1).toBeCalledTimes(0);
      fireEvent.click(getByText('mock action 1'));
      expect(mockOnClick1).toBeCalledTimes(1);
      expect(baseElement.querySelector('div.action')).toHaveClass('active');
      await waitFor(() =>
        expect(baseElement.querySelector('div.action')).not.toHaveClass('active')
      );
      fireEvent.click(getByText('mock action 2'));
      expect(mockOnClick2).toBeCalledTimes(0);
      expect(baseElement.querySelectorAll('div.action')[1]).not.toHaveClass('active');
    });
  });

  describe('number item', () => {
    test('when unit is mm', async () => {
      mockStorage.mockReturnValue('mm');
      const { baseElement, container, getByText } = render(
        <MockNumberItem id="mock-number-item-mm" />
      );
      expect(container).toMatchSnapshot();
      const mask = baseElement.querySelector('div.mask');
      const objectPanelItem = baseElement.querySelector('div.object-panel-item');
      const displayBtn = baseElement.querySelector('button.number-item');
      expect(mask).toHaveClass('hide');
      expect(displayBtn).toHaveTextContent('1');
      expect(objectPanelItem).not.toHaveClass('active');
      fireEvent.click(objectPanelItem);
      expect(mask).not.toHaveClass('hide');
      expect(objectPanelItem).toHaveClass('active');
      expect(baseElement).toMatchSnapshot();
      expect(mockUpdateValue).toBeCalledTimes(0);

      fireEvent.click(baseElement.querySelectorAll('.step-buttons button')[1]);
      expect(mockUpdateValue).toBeCalledTimes(1);
      expect(mockUpdateValue).toHaveBeenNthCalledWith(1, 2);
      expect(displayBtn).toHaveTextContent('2');

      fireEvent.click(getByText('8'));
      expect(mockUpdateValue).toBeCalledTimes(2);
      expect(mockUpdateValue).toHaveBeenNthCalledWith(2, 28);
      expect(displayBtn).toHaveTextContent('28');

      fireEvent.click(getByText('.'));
      expect(mockUpdateValue).toBeCalledTimes(3);
      expect(mockUpdateValue).toHaveBeenNthCalledWith(3, 28);
      expect(displayBtn).toHaveTextContent('28.');
      expect(getByText('.').parentElement).toHaveClass('adm-button-disabled');

      fireEvent.click(getByText('5'));
      expect(mockUpdateValue).toBeCalledTimes(4);
      expect(mockUpdateValue).toHaveBeenNthCalledWith(4, 28.5);
      expect(displayBtn).toHaveTextContent('28.5');

      fireEvent.click(getByText('3'));
      expect(mockUpdateValue).toBeCalledTimes(5);
      expect(mockUpdateValue).toHaveBeenNthCalledWith(5, 28.53);
      expect(displayBtn).toHaveTextContent('28.53');
      expect(getByText('1').parentElement).toHaveClass('adm-button-disabled');

      fireEvent.click(baseElement.querySelectorAll('.step-buttons button')[0]);
      expect(mockUpdateValue).toBeCalledTimes(6);
      expect(mockUpdateValue).toHaveBeenNthCalledWith(6, 27.53);
      expect(displayBtn).toHaveTextContent('27.53');

      fireEvent.click(baseElement.querySelectorAll('.input-keys button')[11]);
      expect(mockUpdateValue).toBeCalledTimes(7);
      expect(mockUpdateValue).toHaveBeenNthCalledWith(7, 27.5);
      expect(displayBtn).toHaveTextContent('27.5');

      fireEvent.click(mask);
      expect(mask).toHaveClass('hide');
      expect(baseElement.querySelector('.adm-popover')).toHaveClass('adm-popover-hidden');
      expect(objectPanelItem).not.toHaveClass('active');
      expect(displayBtn).toHaveTextContent('27.5');
    });

    test('when unit is inch', async () => {
      mockStorage.mockReturnValue('inches');
      const { baseElement, container, getByText } = render(
        <MockNumberItem id="mock-number-item-inch" />
      );
      expect(container).toMatchSnapshot();
      const mask = baseElement.querySelector('div.mask');
      const objectPanelItem = baseElement.querySelector('div.object-panel-item');
      const displayBtn = baseElement.querySelector('button.number-item');
      expect(mask).toHaveClass('hide');
      expect(displayBtn).toHaveTextContent('0.0394');
      expect(objectPanelItem).not.toHaveClass('active');
      fireEvent.click(objectPanelItem);
      expect(mask).not.toHaveClass('hide');
      expect(objectPanelItem).toHaveClass('active');
      expect(mockUpdateValue).toBeCalledTimes(0);

      expect(getByText('.').parentElement).toHaveClass('adm-button-disabled');
      expect(getByText('1').parentElement).toHaveClass('adm-button-disabled');
      fireEvent.click(baseElement.querySelectorAll('.input-keys button')[11]);
      expect(mockUpdateValue).toBeCalledTimes(1);
      expect(mockUpdateValue).toHaveBeenNthCalledWith(1, 0.9906);
      expect(displayBtn).toHaveTextContent('0.039');
      expect(getByText('.').parentElement).toHaveClass('adm-button-disabled');
      expect(getByText('1').parentElement).not.toHaveClass('adm-button-disabled');

      fireEvent.click(baseElement.querySelectorAll('.step-buttons button')[1]);
      expect(mockUpdateValue).toBeCalledTimes(2);
      expect(mockUpdateValue).toHaveBeenNthCalledWith(2, 26.3906);
      expect(displayBtn).toHaveTextContent('1.039');

      fireEvent.click(getByText('0'));
      expect(mockUpdateValue).toBeCalledTimes(3);
      expect(mockUpdateValue).toHaveBeenNthCalledWith(3, 26.3906);
      expect(displayBtn).toHaveTextContent('1.0390');
      expect(getByText('1').parentElement).toHaveClass('adm-button-disabled');

      fireEvent.click(mask);
      expect(mask).toHaveClass('hide');
      expect(baseElement.querySelector('.adm-popover')).toHaveClass('adm-popover-hidden');
      expect(objectPanelItem).not.toHaveClass('active');
      expect(displayBtn).toHaveTextContent('1.0390');
    });

    test('when unit is degree', async () => {
      mockStorage.mockReturnValue('inches');
      const { baseElement, container } = render(
        <MockNumberItem id="mock-number-item-angle" unit="degree" />
      );
      expect(container).toMatchSnapshot();
      const mask = baseElement.querySelector('div.mask');
      const objectPanelItem = baseElement.querySelector('div.object-panel-item');
      const displayBtn = baseElement.querySelector('button.number-item');
      expect(mask).toHaveClass('hide');
      expect(displayBtn).toHaveTextContent('1°');
      expect(objectPanelItem).not.toHaveClass('active');
      fireEvent.click(objectPanelItem);
      expect(mask).not.toHaveClass('hide');
      expect(objectPanelItem).toHaveClass('active');
      expect(mockUpdateValue).toBeCalledTimes(0);

      fireEvent.click(baseElement.querySelectorAll('.step-buttons button')[1]);
      expect(mockUpdateValue).toBeCalledTimes(1);
      expect(mockUpdateValue).toHaveBeenNthCalledWith(1, 2);
      expect(displayBtn).toHaveTextContent('2°');

      fireEvent.click(mask);
      expect(mask).toHaveClass('hide');
      expect(baseElement.querySelector('.adm-popover')).toHaveClass('adm-popover-hidden');
      expect(objectPanelItem).not.toHaveClass('active');
      expect(displayBtn).toHaveTextContent('2°');
    });

    test('when decimal is given', async () => {
      const { baseElement, getByText } = render(
        <MockNumberItem id="mock-number-item-integer" decimal={3} />
      );
      const mask = baseElement.querySelector('div.mask');
      const objectPanelItem = baseElement.querySelector('div.object-panel-item');
      const displayBtn = baseElement.querySelector('button.number-item');
      expect(mask).toHaveClass('hide');
      expect(displayBtn).toHaveTextContent('1');
      expect(objectPanelItem).not.toHaveClass('active');
      fireEvent.click(objectPanelItem);
      expect(mask).not.toHaveClass('hide');
      expect(objectPanelItem).toHaveClass('active');
      expect(getByText('.').parentElement).not.toHaveClass('adm-button-disabled');

      fireEvent.click(getByText('.'));
      expect(getByText('.').parentElement).toHaveClass('adm-button-disabled');
      fireEvent.click(getByText('1'));
      fireEvent.click(getByText('1'));
      expect(getByText('1').parentElement).not.toHaveClass('adm-button-disabled');
      fireEvent.click(getByText('1'));
      expect(displayBtn).toHaveTextContent('0.111');
      expect(mockUpdateValue).toBeCalledTimes(4);
      expect(getByText('1').parentElement).toHaveClass('adm-button-disabled');
    });

    test('when decimal is 0', async () => {
      const { baseElement, getByText } = render(
        <MockNumberItem id="mock-number-item-integer" decimal={0} />
      );
      const mask = baseElement.querySelector('div.mask');
      const objectPanelItem = baseElement.querySelector('div.object-panel-item');
      const displayBtn = baseElement.querySelector('button.number-item');
      expect(mask).toHaveClass('hide');
      expect(displayBtn).toHaveTextContent('1');
      expect(objectPanelItem).not.toHaveClass('active');
      fireEvent.click(objectPanelItem);
      expect(mask).not.toHaveClass('hide');
      expect(objectPanelItem).toHaveClass('active');
      expect(getByText('.').parentElement).toHaveClass('adm-button-disabled');
    });

    test('min&max should work', async () => {
      const { baseElement, getByText } = render(<MockNumberItem id="mock-number-item-integer" />);
      const mask = baseElement.querySelector('div.mask');
      const objectPanelItem = baseElement.querySelector('div.object-panel-item');
      const displayBtn = baseElement.querySelector('button.number-item');
      expect(mask).toHaveClass('hide');
      expect(displayBtn).toHaveTextContent('1');
      expect(objectPanelItem).not.toHaveClass('active');
      fireEvent.click(objectPanelItem);
      expect(mask).not.toHaveClass('hide');
      expect(objectPanelItem).toHaveClass('active');
      fireEvent.click(getByText('5'));
      fireEvent.click(getByText('1'));
      expect(displayBtn).toHaveTextContent('51');
      expect(mockUpdateValue).toBeCalledTimes(2);
      fireEvent.click(mask);
      expect(mask).toHaveClass('hide');
      expect(baseElement.querySelector('.adm-popover')).toHaveClass('adm-popover-hidden');
      expect(objectPanelItem).not.toHaveClass('active');
      expect(mockUpdateValue).toBeCalledTimes(3);
      expect(displayBtn).toHaveTextContent('50');
    });
  });

  describe('select', () => {
    test('with only one option', () => {
      const { container } = render(<MockSelect options={[{ value: 1, label: 'option-1' }]} />);
      expect(container).toMatchSnapshot();
    });

    test('with multiple options', async () => {
      mockStorage.mockReturnValue('inches');
      const { baseElement, container, getByText } = render(
        <MockSelect
          options={[
            { value: 1, label: 'option-1' },
            { value: 2, label: 'option-2' },
          ]}
        />
      );
      expect(container).toMatchSnapshot();
      const mask = baseElement.querySelector('div.mask');
      const objectPanelItem = baseElement.querySelector('div.object-panel-item');
      const displayContent = baseElement.querySelector('.selected-content');
      expect(mask).toHaveClass('hide');
      expect(displayContent).toHaveTextContent('display label 1');
      expect(objectPanelItem).not.toHaveClass('active');
      fireEvent.click(objectPanelItem);
      expect(mask).not.toHaveClass('hide');
      expect(objectPanelItem).toHaveClass('active');
      expect(mockUpdateValue).toBeCalledTimes(0);
      expect(getByText('option-1').parentElement).toHaveClass('active');
      expect(getByText('option-2').parentElement).not.toHaveClass('active');

      fireEvent.click(getByText('option-2'));
      expect(mockUpdateValue).toBeCalledTimes(1);
      expect(mockUpdateValue).toHaveBeenNthCalledWith(1, 2);
      expect(displayContent).toHaveTextContent('display label 2');
      await waitFor(() => expect(objectPanelItem).not.toHaveClass('active'));
      expect(baseElement.querySelector('.adm-popover')).toHaveClass('adm-popover-hidden');
      expect(mask).toHaveClass('hide');

      fireEvent.click(objectPanelItem);
      expect(mask).not.toHaveClass('hide');
      expect(objectPanelItem).toHaveClass('active');
      expect(getByText('option-1').parentElement).not.toHaveClass('active');
      expect(getByText('option-2').parentElement).toHaveClass('active');
    });
  });
});
