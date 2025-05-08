import React, { act } from 'react';
import { fireEvent, render } from '@testing-library/react';

import ImageDisplay from './ImageDisplay';

describe('test ImageDisplay', () => {
  it('should render correctly without img', () => {
    const { container } = render(<ImageDisplay img={null} />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly with img', () => {
    const { container, getByText } = render(
      <ImageDisplay
        img={{
          blob: new Blob(),
          url: 'test-url',
        }}
        renderContents={() => <div>mock-render-contents</div>}
      />,
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('svg')).not.toBeInTheDocument();

    const img = container.querySelector('img');

    act(() => fireEvent.load(img!));

    expect(container).toMatchSnapshot();
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(getByText('mock-render-contents')).toBeInTheDocument();
  });
});
