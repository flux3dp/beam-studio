/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';

import { BoxgenContext } from 'app/contexts/BoxgenContext';

import Boxgen from './Boxgen';

jest.mock('helpers/useI18n', () => () => ({
  buttons: {
    back_to_beam_studio: 'Back to Beam Studio',
  },
  boxgen: {
    title: 'BOXGEN',
  },
}));

jest.mock('app/contexts/BoxgenContext', () => ({
  BoxgenContext: React.createContext({ onClose: () => {} }),
  BoxgenProvider: ({ onClose, children }: any) => (
    <BoxgenContext.Provider value={{ onClose } as any}>{children}</BoxgenContext.Provider>
  ),
}));

jest.mock(
  'app/widgets/FullWindowPanel/FullWindowPanel',
  () =>
    ({
      mobileTitle,
      renderMobileFixedContent,
      renderMobileContents,
      renderContents,
      onClose,
    }: any) =>
      (
        <div>
          <div>mobileTitle: {mobileTitle}</div>
          <div>{renderMobileFixedContent?.()}</div>
          <div>{renderMobileContents?.()}</div>
          <div>{renderContents?.()}</div>
          <button type="button" onClick={onClose}>
            back
          </button>
        </div>
      )
);

jest.mock(
  'app/widgets/FullWindowPanel/BackButton',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      <div className="back button">{children}</div>
);

jest.mock(
  'app/widgets/FullWindowPanel/Footer',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      <div className="footer">{children}</div>
);

jest.mock(
  'app/widgets/FullWindowPanel/Header',
  () =>
    ({ title, children }: { title: string; children: React.ReactNode }) =>
      (
        <div className="header">
          <div>title: {title}</div>
          {children}
        </div>
      )
);

jest.mock(
  'app/widgets/FullWindowPanel/Sider',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      <div className="sider">{children}</div>
);

jest.mock('./BoxCanvas', () => 'mock-canvas');
jest.mock('./BoxSelector', () => 'mock-box-selector');
jest.mock('./Controller', () => 'mock-box-controller');
jest.mock('./ExportButton', () => 'mock-export-button');

const mockOnClose = jest.fn();

describe('test Boxgen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should rendered correctly', () => {
    const { container } = render(<Boxgen onClose={mockOnClose} />);
    expect(container).toMatchSnapshot();
    const button = container.querySelector('button');
    fireEvent.click(button);
    waitFor(() => expect(mockOnClose).toBeCalledTimes(1));
  });
});
