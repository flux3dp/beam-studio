import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import AdvancedSettingButton from './AdvancedSettingButton';

jest.mock('./AdvancedSettingModal', () => ({ onClose }: { onClose: () => void }) => (
  <div>
    AdvancedSettingModal
    <button onClick={onClose} type="button">
      MockCloseButton
    </button>
  </div>
));

describe('test AdvancedSettingButton', () => {
  it('should render correctly', () => {
    const { container } = render(<AdvancedSettingButton />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when type is panel-item', () => {
    const { container } = render(<AdvancedSettingButton type="panel-item" />);

    expect(container).toMatchSnapshot();
  });

  test('open and close modal should work', () => {
    const { container, queryByText } = render(<AdvancedSettingButton />);

    fireEvent.click(container.querySelector('#advanced-setting'));
    expect(queryByText('AdvancedSettingModal')).toBeInTheDocument();
    fireEvent.click(queryByText('MockCloseButton'));
    expect(queryByText('AdvancedSettingModal')).not.toBeInTheDocument();
  });
});
