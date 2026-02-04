import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import FillBlock from './FillBlock';

jest.mock('./FillSettingModal', () => ({ onClose }: any) => (
  <div>
    FillSettingModal
    <button onClick={onClose} type="button">
      MockCloseButton
    </button>
  </div>
));

describe('test FillBlock', () => {
  it('should render correctly', () => {
    const { container } = render(<FillBlock />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when type is panel-item', () => {
    const { container } = render(<FillBlock type="panel-item" />);

    expect(container).toMatchSnapshot();
  });

  test('open and close modal should work', () => {
    const { container, queryByText } = render(<FillBlock />);

    fireEvent.click(container.querySelector('.icon'));
    expect(queryByText('FillSettingModal')).toBeInTheDocument();
    fireEvent.click(queryByText('MockCloseButton'));
    expect(queryByText('FillSettingModal')).not.toBeInTheDocument();
  });
});
