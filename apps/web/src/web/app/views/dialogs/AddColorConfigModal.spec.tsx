import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import AddColorConfigModal from './AddColorConfigModal';

const mockOnClose = jest.fn();
const mockHandleAddConfig = jest.fn();

jest.mock('helpers/useI18n', () => () => ({
  beambox: {
    layer_color_config_panel: {
      add_config: 'Add Config',
      add: 'Add',
      color: 'Color',
      power: 'Power',
      speed: 'Speed',
      repeat: 'Repeat',
    },
  },
}));

jest.mock('app/widgets/Unit-Input-v2', () => () => <div>UnitInput</div>);

describe('test AddColorConfigModal', () => {
  it('should render correctly', () => {
    const { baseElement } = render(
      <AddColorConfigModal
        onClose={mockOnClose}
        handleAddConfig={mockHandleAddConfig}
      />,
    );
    expect(baseElement).toMatchSnapshot();
  });

  it('should call onClose when click cancel button', () => {
    const { getByText } = render(
      <AddColorConfigModal
        onClose={mockOnClose}
        handleAddConfig={mockHandleAddConfig}
      />,
    );
    expect(mockOnClose).not.toBeCalled();
    fireEvent.click(getByText('Cancel'));
    expect(mockOnClose).toBeCalledTimes(1);
  });

  it('should call handleAddConfig when click add button', () => {
    const { getByText } = render(
      <AddColorConfigModal
        onClose={mockOnClose}
        handleAddConfig={mockHandleAddConfig}
      />,
    );
    expect(mockHandleAddConfig).not.toBeCalled();
    fireEvent.click(getByText('Add'));
    expect(mockHandleAddConfig).toBeCalledTimes(1);
    expect(mockHandleAddConfig).toHaveBeenLastCalledWith({
      color: '#FFFFFF',
      power: 50,
      speed: 10,
      repeat: 1,
    });
  });
});
