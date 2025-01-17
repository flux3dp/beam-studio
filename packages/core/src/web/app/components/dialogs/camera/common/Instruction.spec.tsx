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
        title="title"
        text="text"
        buttons={[{ label: 'label', onClick: mockOnClick }]}
      />
    );
    expect(baseElement).toMatchSnapshot();
    const button = getByText('label');
    expect(mockOnClick).not.toBeCalled();
    fireEvent.click(button);
    expect(mockOnClick).toBeCalledTimes(1);
  });
});
