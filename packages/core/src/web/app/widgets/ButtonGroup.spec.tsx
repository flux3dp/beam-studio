import React from 'react';

import { render } from '@testing-library/react';

import ButtonGroup from './ButtonGroup';

describe('should render correctly', () => {
  test('no buttons', () => {
    const { container } = render(<ButtonGroup buttons={[]} className="flux" />);

    expect(container).toMatchSnapshot();
  });

  test('has buttons', () => {
    const { container } = render(
      <ButtonGroup
        buttons={[
          {
            className: 'btn-test',
            dataAttrs: {
              abc: 123,
            },
            href: 'https://flux3dp.com/',
            label: 'BTN-LABEL',
            onClick: jest.fn(),
            right: true,
            type: 'link',
          },
          {
            className: '',
            label: 'icon-label',
            onClick: jest.fn(),
            right: false,
            title: 'flux3dp',
            type: 'icon',
          },
          {
            label: 'button-label',
            onClick: jest.fn(),
            onMouseDown: jest.fn(),
            onMouseLeave: jest.fn(),
            onMouseUp: jest.fn(),
            title: 'flux3dp',
          },
        ]}
        className="flux"
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
