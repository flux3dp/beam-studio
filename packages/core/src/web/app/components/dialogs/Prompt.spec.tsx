import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import Prompt from './Prompt';

const mockWrite = jest.fn();
const mockRead = jest.fn();

jest.mock('@core/helpers/api/alert-config', () => ({
  read: (...args: any[]) => mockRead(...args),
  write: (...args: any[]) => mockWrite(...args),
}));

const onYes = jest.fn();
const onCancel = jest.fn();
const onClose = jest.fn();

describe('test Prompt', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('should render correctly', () => {
    const { baseElement, getByText } = render(
      <Prompt caption="New Preset Name" defaultValue="" onCancel={onCancel} onClose={onClose} onYes={onYes} />,
    );

    expect(baseElement).toMatchSnapshot();

    expect(onYes).not.toBeCalled();
    expect(onClose).not.toBeCalled();
    baseElement.querySelector('input').value = 'value';
    fireEvent.click(getByText('OK'));
    expect(onYes).toBeCalledTimes(1);
    expect(onYes).toHaveBeenLastCalledWith('value');
    expect(onClose).toBeCalledTimes(1);

    expect(onCancel).not.toBeCalled();
    fireEvent.click(getByText('Cancel'));
    expect(onCancel).toBeCalledTimes(1);
    expect(onClose).toBeCalledTimes(2);
  });

  it('should work with confirmValue', () => {
    const { baseElement, getByText } = render(
      <Prompt
        caption="New Preset Name"
        confirmValue="value"
        defaultValue=""
        onCancel={onCancel}
        onClose={onClose}
        onYes={onYes}
      />,
    );

    expect(baseElement).toMatchSnapshot();

    expect(onYes).not.toBeCalled();
    baseElement.querySelector('input').value = 'not-value';
    fireEvent.click(getByText('OK'));
    expect(onYes).toBeCalledTimes(1);
    expect(onYes).toHaveBeenLastCalledWith('not-value');
    expect(onClose).not.toBeCalled();

    baseElement.querySelector('input').value = 'value';
    fireEvent.click(getByText('OK'));
    expect(onYes).toBeCalledTimes(2);
    expect(onYes).toHaveBeenLastCalledWith('value');
    expect(onClose).toBeCalledTimes(1);

    expect(onCancel).not.toBeCalled();
    fireEvent.click(getByText('Cancel'));
    expect(onCancel).toBeCalledTimes(1);
    expect(onClose).toBeCalledTimes(2);
  });

  it('should work with alertConfigKey', () => {
    const { baseElement, getByText } = render(
      <Prompt
        alertConfigKey="skip_svg_version_warning"
        caption="New Preset Name"
        confirmValue="value"
        defaultValue=""
        onCancel={onCancel}
        onClose={onClose}
        onYes={onYes}
      />,
    );

    expect(baseElement).toMatchSnapshot();

    fireEvent.click(baseElement.querySelector('input[type="checkbox"]'));
    expect(onYes).not.toBeCalled();
    baseElement.querySelector('input').value = 'not-value';
    fireEvent.click(getByText('OK'));
    expect(onYes).toBeCalledTimes(1);
    expect(onYes).toHaveBeenLastCalledWith('not-value');
    expect(onClose).not.toBeCalled();
    expect(mockWrite).not.toBeCalled();

    baseElement.querySelector('input').value = 'value';
    fireEvent.click(getByText('OK'));
    expect(onYes).toBeCalledTimes(2);
    expect(onYes).toHaveBeenLastCalledWith('value');
    expect(onClose).toBeCalledTimes(1);
    expect(mockWrite).toBeCalledTimes(1);
    expect(mockWrite).toHaveBeenLastCalledWith('skip_svg_version_warning', true);

    expect(onCancel).not.toBeCalled();
    fireEvent.click(getByText('Cancel'));
    expect(onCancel).toBeCalledTimes(1);
    expect(onClose).toBeCalledTimes(2);
  });
});
