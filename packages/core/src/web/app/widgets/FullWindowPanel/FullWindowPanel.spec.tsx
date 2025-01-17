import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import FullWindowPanel from './FullWindowPanel';

jest.mock(
  'app/widgets/FloatingPanel',
  () =>
    ({ title, className, anchors, fixedContent, children, onClose }: any) =>
      (
        <div className={className}>
          <div>title: {title}</div>
          <div>anchors: {anchors.join(' ')}</div>
          <div>{fixedContent}</div>
          <button type="button" onClick={onClose}>
            close
          </button>
          {children}
        </div>
      )
);

const mockIsWeb = jest.fn();
jest.mock('helpers/is-web', () => () => mockIsWeb());

const mockUseIsMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

const mockOnClose = jest.fn();

describe('test FullWindowPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly in mobile', () => {
    mockIsWeb.mockReturnValue(true);
    mockUseIsMobile.mockReturnValue(true);
    const { container, getByText, queryByText } = render(
      <FullWindowPanel
        mobileTitle="mobile title"
        renderMobileContents={() => <div>Mobile Contents</div>}
        renderMobileFixedContent={() => <div>Mobile Fixed Content</div>}
        renderContents={() => <div>Desktop Contents</div>}
        onClose={mockOnClose}
      />
    );
    expect(container).toMatchSnapshot();
    expect(queryByText('Desktop Contents')).not.toBeInTheDocument();
    expect(mockOnClose).not.toBeCalled();
    fireEvent.click(getByText('close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should render correctly in desktop', () => {
    window.os = 'Windows';
    mockIsWeb.mockReturnValue(true);
    mockUseIsMobile.mockReturnValue(false);
    const { container, queryByText } = render(
      <FullWindowPanel
        mobileTitle="mobile title"
        renderMobileContents={() => <div>Mobile Contents</div>}
        renderMobileFixedContent={() => <div>Mobile Fixed Content</div>}
        renderContents={() => <div>Desktop Contents</div>}
        onClose={mockOnClose}
      />
    );
    expect(container).toMatchSnapshot();
    expect(queryByText('Mobile Contents')).not.toBeInTheDocument();
  });
});
