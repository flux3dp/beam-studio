import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import Instruction from './Instruction';

const mockOnClick = jest.fn();

describe('test Instruction', () => {
  beforeAll(() => {
    // https://stackoverflow.com/questions/62732346/test-exception-unstable-flushdiscreteupdates
    Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
      set: jest.fn(),
    });
  });

  it('should render correctly', () => {
    const { baseElement, getByText } = render(
      <Instruction
        animationSrcs={[{ src: 'video.webm', type: 'image/webm' }]}
        buttons={[{ label: 'label', onClick: mockOnClick }]}
        contentBeforeSteps="text"
        title="title"
      />,
    );

    expect(baseElement).toMatchSnapshot();

    const button = getByText('label');

    expect(mockOnClick).not.toHaveBeenCalled();
    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
