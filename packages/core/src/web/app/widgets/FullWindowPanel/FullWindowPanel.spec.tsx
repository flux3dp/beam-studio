import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import FullWindowPanel from './FullWindowPanel';
import { __setMockOS } from '@mocks/@core/helpers/getOS';

jest.mock(
  '@core/app/widgets/FloatingPanel',
  () =>
    ({ anchors, children, className, fixedContent, onClose, title }: any) => (
      <div className={className}>
        <div>title: {title}</div>
        <div>anchors: {anchors.join(' ')}</div>
        <div>{fixedContent}</div>
        <button onClick={onClose} type="button">
          close
        </button>
        {children}
      </div>
    ),
);

const mockIsWeb = jest.fn();

jest.mock('@core/helpers/is-web', () => () => mockIsWeb());

const mockUseIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

const mockOnClose = jest.fn();

describe('test FullWindowPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __setMockOS('others');
  });

  it('should render correctly in mobile', () => {
    mockIsWeb.mockReturnValue(true);
    mockUseIsMobile.mockReturnValue(true);

    const { container, getByText, queryByText } = render(
      <FullWindowPanel
        mobileTitle="mobile title"
        onClose={mockOnClose}
        renderContents={() => <div>Desktop Contents</div>}
        renderMobileContents={() => <div>Mobile Contents</div>}
        renderMobileFixedContent={() => <div>Mobile Fixed Content</div>}
      />,
    );

    expect(container).toMatchSnapshot();
    expect(queryByText('Desktop Contents')).not.toBeInTheDocument();
    expect(mockOnClose).not.toBeCalled();
    fireEvent.click(getByText('close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should render correctly in desktop', () => {
    __setMockOS('Windows');
    mockIsWeb.mockReturnValue(true);
    mockUseIsMobile.mockReturnValue(false);

    const { container, queryByText } = render(
      <FullWindowPanel
        mobileTitle="mobile title"
        onClose={mockOnClose}
        renderContents={() => <div>Desktop Contents</div>}
        renderMobileContents={() => <div>Mobile Contents</div>}
        renderMobileFixedContent={() => <div>Mobile Fixed Content</div>}
      />,
    );

    expect(container).toMatchSnapshot();
    expect(queryByText('Mobile Contents')).not.toBeInTheDocument();
  });
});
