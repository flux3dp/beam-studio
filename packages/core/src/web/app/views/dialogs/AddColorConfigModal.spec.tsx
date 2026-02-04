import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import AddColorConfigModal from './AddColorConfigModal';

const mockOnClose = jest.fn();
const mockHandleAddConfig = jest.fn();

jest.mock('@core/helpers/useI18n', () => () => ({
  beambox: {
    layer_color_config_panel: {
      add: 'Add',
      add_config: 'Add Config',
      color: 'Color',
      power: 'Power',
      repeat: 'Repeat',
      speed: 'Speed',
    },
  },
}));

jest.mock('@core/app/widgets/Unit-Input-v2', () => () => <div>UnitInput</div>);

describe('test AddColorConfigModal', () => {
  it('should render correctly', () => {
    const { baseElement } = render(<AddColorConfigModal handleAddConfig={mockHandleAddConfig} onClose={mockOnClose} />);

    expect(baseElement).toMatchSnapshot();
  });

  it('should call onClose when click cancel button', () => {
    const { getByText } = render(<AddColorConfigModal handleAddConfig={mockHandleAddConfig} onClose={mockOnClose} />);

    expect(mockOnClose).not.toHaveBeenCalled();
    fireEvent.click(getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call handleAddConfig when click add button', () => {
    const { getByText } = render(<AddColorConfigModal handleAddConfig={mockHandleAddConfig} onClose={mockOnClose} />);

    expect(mockHandleAddConfig).not.toHaveBeenCalled();
    fireEvent.click(getByText('Add'));
    expect(mockHandleAddConfig).toHaveBeenCalledTimes(1);
    expect(mockHandleAddConfig).toHaveBeenLastCalledWith({
      color: '#FFFFFF',
      power: 50,
      repeat: 1,
      speed: 10,
    });
  });
});
