import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import FlipButtons from './FlipButtons';

const mockFlipSelectedElements = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) => {
    callback({
      Canvas: {
        flipSelectedElements: (...args) => mockFlipSelectedElements(...args),
      },
    });
  },
}));

const mockUseIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

jest.mock('@core/helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      object_panel: {
        flip: 'flip',
        hflip: 'hflip',
        vflip: 'vflip',
      },
    },
  },
}));

jest.mock('../ObjectPanelItem', () => ({
  ActionList: ({ actions, content, id, label }: any) => (
    <div id={id}>
      {actions.map(({ icon, label: actionLabel, onClick }) => (
        <div key={actionLabel} onClick={onClick}>
          {icon}
          {actionLabel}
        </div>
      ))}
      {content}
      {label}
    </div>
  ),
}));

describe('test FlipButtons', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should render correctly when not in mobile', () => {
    mockUseIsMobile.mockReturnValue(false);

    const { container } = render(<FlipButtons />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when in mobile', () => {
    mockUseIsMobile.mockReturnValue(true);

    const { container } = render(<FlipButtons />);

    expect(container).toMatchSnapshot();
  });

  test('callback should work', () => {
    mockUseIsMobile.mockReturnValue(false);

    const { container } = render(<FlipButtons />);

    expect(mockFlipSelectedElements).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector('#horizontal_flip'));
    expect(mockFlipSelectedElements).toHaveBeenCalledTimes(1);
    expect(mockFlipSelectedElements).toHaveBeenLastCalledWith(-1, 1);
    fireEvent.click(container.querySelector('#vertical_flip'));
    expect(mockFlipSelectedElements).toHaveBeenCalledTimes(2);
    expect(mockFlipSelectedElements).toHaveBeenLastCalledWith(1, -1);
  });
});
