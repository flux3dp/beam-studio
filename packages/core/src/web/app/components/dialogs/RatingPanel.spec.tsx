import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import RatingPanel from './RatingPanel';

jest.mock('antd', () => ({
  Checkbox: ({ checked, onChange }: any) => (
    <div>
      Dummy Checkbox
      <p>checked: {String(checked)}</p>
      <button onClick={() => onChange({ target: { checked: !checked } })} type="button">
        checkbox
      </button>
    </div>
  ),
  get Form() {
    const mockFormItem = ({ children, label }: any) => (
      <div>
        Dummy FormItem
        <p>label: {label}</p>
        {children}
      </div>
    );
    const mockForm = ({ children }: any) => (
      <div>
        Dummy Form
        {children}
      </div>
    );

    mockForm.Item = mockFormItem;

    return mockForm;
  },
  Modal: ({ children, onCancel, onOk, ...props }: any) => (
    <div>
      Dummy Modal
      <p>props: {JSON.stringify(props)}</p>
      {children}
      <button onClick={onOk} type="button">
        ok
      </button>
      <button onClick={onCancel} type="button">
        cancel
      </button>
    </div>
  ),
  Rate: ({ onChange }: any) => (
    <div>
      Dummy Rate
      <button onClick={() => onChange(5)} type="button">
        change
      </button>
    </div>
  ),
}));

const mockSetNotShowing = jest.fn();

jest.mock('@core/helpers/rating-helper', () => ({
  setNotShowing: () => mockSetNotShowing(),
}));

const onClose = jest.fn();
const onSubmit = jest.fn();

describe('test RatingPanel', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<RatingPanel onClose={onClose} onSubmit={onSubmit} />);

    expect(container).toMatchSnapshot();
  });

  test('set star and submit should work', () => {
    const { container, getByText } = render(<RatingPanel onClose={onClose} onSubmit={onSubmit} />);

    fireEvent.click(getByText('change'));
    expect(container).toMatchSnapshot();
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.click(getByText('ok'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenLastCalledWith(5);
    expect(container).toMatchSnapshot();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(getByText('ok'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('toggle checkbox and cancel should work', () => {
    const { container, getByText } = render(<RatingPanel onClose={onClose} onSubmit={onSubmit} />);

    fireEvent.click(getByText('checkbox'));
    expect(container).toMatchSnapshot();
    expect(onClose).not.toHaveBeenCalled();
    expect(mockSetNotShowing).not.toHaveBeenCalled();
    fireEvent.click(getByText('cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockSetNotShowing).toHaveBeenCalledTimes(1);
  });
});
