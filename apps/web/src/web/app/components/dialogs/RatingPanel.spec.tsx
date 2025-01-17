import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import RatingPanel from './RatingPanel';

jest.mock('antd', () => ({
  Checkbox: ({ checked, onChange }: any) => (
    <div>
      Dummy Checkbox
      <p>checked: {String(checked)}</p>
      <button type="button" onClick={() => onChange({ target: { checked: !checked } })}>
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
  Modal: ({ children, onOk, onCancel, ...props }: any) => (
    <div>
      Dummy Modal
      <p>props: {JSON.stringify(props)}</p>
      {children}
      <button type="button" onClick={onOk}>
        ok
      </button>
      <button type="button" onClick={onCancel}>
        cancel
      </button>
    </div>
  ),
  Rate: ({ onChange }: any) => (
    <div>
      Dummy Rate
      <button type="button" onClick={() => onChange(5)}>
        change
      </button>
    </div>
  ),
}));

jest.mock('helpers/i18n', () => ({
  lang: {
    beambox: {
      rating_panel: {
        title: 'Enjoy Beam Studio?',
        description:
          'If you like Beam Studio, we would greatly appreciate it if you could rate us.',
        dont_show_again: "Don't Show this next time.",
        thank_you: 'Thank You for the feedback!',
      },
    },
  },
}));

const mockSetNotShowing = jest.fn();
jest.mock('helpers/rating-helper', () => ({
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
    expect(onSubmit).not.toBeCalled();
    fireEvent.click(getByText('ok'));
    expect(onSubmit).toBeCalledTimes(1);
    expect(onSubmit).toHaveBeenLastCalledWith(5);
    expect(container).toMatchSnapshot();
    expect(onClose).not.toBeCalled();
    fireEvent.click(getByText('ok'));
    expect(onClose).toBeCalledTimes(1);
  });

  test('toggle checkbox and cancel should work', () => {
    const { container, getByText } = render(<RatingPanel onClose={onClose} onSubmit={onSubmit} />);
    fireEvent.click(getByText('checkbox'));
    expect(container).toMatchSnapshot();
    expect(onClose).not.toBeCalled();
    expect(mockSetNotShowing).not.toBeCalled();
    fireEvent.click(getByText('cancel'));
    expect(onClose).toBeCalledTimes(1);
    expect(mockSetNotShowing).toBeCalledTimes(1);
  });
});
