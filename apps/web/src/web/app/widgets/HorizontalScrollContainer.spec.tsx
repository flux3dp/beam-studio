import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import HorizontalScrollContainer from './HorizontalScrollContainer';

declare const expect: jest.Expect;

describe('test HorizontalScrollContainer', () => {
  it('should work', () => {
    const { container } = render(
      <HorizontalScrollContainer className="classname">
        <div />
      </HorizontalScrollContainer>
    );
    expect(container).toMatchSnapshot();
    const div = container.querySelector('.classname') as Element;
    fireEvent.wheel(div, {
      currentTarget: {
        scrollLeft: 0,
      },
      deltaY: 100,
    });
    expect(div.scrollLeft).toBe(100);
    fireEvent.wheel(div, {
      currentTarget: {
        scrollLeft: 0,
      },
      deltaY: -50,
    });
    expect(div.scrollLeft).toBe(50);
    fireEvent.wheel(div, {
      currentTarget: {
        scrollLeft: 0,
      },
      deltaX: 100,
      deltaY: -50,
    });
    expect(div.scrollLeft).toBe(50);
  });
});
