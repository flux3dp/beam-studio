import React from 'react';
import { fireEvent, render } from '@testing-library/react';

jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  ConfigProvider: ({ children, theme }: any) => (
    <div className="ant-config-provider" data-theme={JSON.stringify(theme)}>
      {children}
    </div>
  ),
}));


jest.mock('@core/app/icons/action-panel/ActionPanelIcons', () => ({
  __esModule: true,
  default: {
    Stamp: () => <svg data-testid="stamp-icon" />,
  },
}));

jest.mock('@core/app/widgets/FullWindowPanel/BackButton', () => ({ children, onClose }: any) => (
  <button data-testid="back-button" onClick={onClose}>
    {children}
  </button>
));

jest.mock('@core/app/widgets/FullWindowPanel/Footer', () => ({ children }: any) => (
  <div data-testid="footer">{children}</div>
));

jest.mock('@core/app/widgets/FullWindowPanel/Header', () => ({ icon, title }: any) => (
  <div data-testid="header">
    {icon}
    <span>{title}</span>
  </div>
));

jest.mock('@core/app/widgets/FullWindowPanel/Sider', () => ({ children, className }: any) => (
  <div className={className} data-testid="sider">
    {children}
  </div>
));

jest.mock('./Content', () => () => <div data-testid="sider-content">Content</div>);

import Sider from './index';

describe('test Sider', () => {
  const mockHandleComplete = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<Sider handleComplete={mockHandleComplete} onClose={mockOnClose} />);

    expect(container).toMatchSnapshot();
  });

  it('should render header with icon and title', () => {
    const { getByTestId, getByText } = render(<Sider handleComplete={mockHandleComplete} onClose={mockOnClose} />);

    expect(getByTestId('header')).toBeInTheDocument();
    expect(getByTestId('stamp-icon')).toBeInTheDocument();
    expect(getByText('Stamp Maker')).toBeInTheDocument();
  });

  it('should render back button with correct text', () => {
    const { getByTestId } = render(<Sider handleComplete={mockHandleComplete} onClose={mockOnClose} />);

    const backButton = getByTestId('back-button');

    expect(backButton).toHaveTextContent('Back to Beam Studio');
  });

  it('should handle back button click', () => {
    const { getByTestId } = render(<Sider handleComplete={mockHandleComplete} onClose={mockOnClose} />);

    const backButton = getByTestId('back-button');

    fireEvent.click(backButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should render sider content', () => {
    const { getByTestId } = render(<Sider handleComplete={mockHandleComplete} onClose={mockOnClose} />);

    expect(getByTestId('sider-content')).toBeInTheDocument();
  });

  it('should render OK button in footer', () => {
    const { getByText } = render(<Sider handleComplete={mockHandleComplete} onClose={mockOnClose} />);

    const okButton = getByText('OK');

    expect(okButton).toBeInTheDocument();
    expect(okButton.closest('button')).toHaveClass('ant-btn-primary');
  });

  it('should handle OK button click', () => {
    const { getByText } = render(<Sider handleComplete={mockHandleComplete} onClose={mockOnClose} />);

    const okButton = getByText('OK');

    fireEvent.click(okButton);

    expect(mockHandleComplete).toHaveBeenCalled();
  });

  it('should apply ConfigProvider theme', () => {
    const { container } = render(<Sider handleComplete={mockHandleComplete} onClose={mockOnClose} />);

    const configProvider = container.querySelector('.ant-config-provider');

    expect(configProvider).toBeInTheDocument();
  });

  it('should apply correct className to sider', () => {
    const { getByTestId } = render(<Sider handleComplete={mockHandleComplete} onClose={mockOnClose} />);

    const sider = getByTestId('sider');

    expect(sider).toHaveClass('sider');
  });
});
