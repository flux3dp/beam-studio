import React from 'react';
import { render } from '@testing-library/react';

import ButtonGroup from './ButtonGroup';

describe('should render correctly', () => {
  test('no buttons', () => {
    const { container } = render(<ButtonGroup className="flux" buttons={[]} />);
    expect(container).toMatchSnapshot();
  });

  test('has buttons', () => {
    const { container } = render(
      <ButtonGroup
        className="flux"
        buttons={[
          {
            type: 'link',
            dataAttrs: {
              abc: 123,
            },
            className: 'btn-test',
            right: true,
            label: 'BTN-LABEL',
            href: 'https://flux3dp.com/',
            onClick: jest.fn(),
          },
          {
            type: 'icon',
            className: '',
            right: false,
            label: 'icon-label',
            title: 'flux3dp',
            onClick: jest.fn(),
          },
          {
            label: 'button-label',
            title: 'flux3dp',
            onClick: jest.fn(),
            onMouseDown: jest.fn(),
            onMouseUp: jest.fn(),
            onMouseLeave: jest.fn(),
          },
        ]}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
