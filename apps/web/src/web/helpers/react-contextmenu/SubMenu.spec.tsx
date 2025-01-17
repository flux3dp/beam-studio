import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import SubMenu from './SubMenu';

describe('SubMenu tests', () => {
  it('should render correctly', () => {
    const { container } = render(<SubMenu title="foo" />);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly when disabled', () => {
    const { container } = render(<SubMenu title="foo" disabled />);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly after onMouseEnter', () => {
    const { container } = render(<SubMenu title="foo" hoverDelay={0} />);
    fireEvent.mouseEnter(container.querySelector('.react-contextmenu-submenu'));
    expect(container).toMatchSnapshot();
  });

  it('should render correctly after onMouseEnter when disabled', () => {
    const { container } = render(<SubMenu title="foo" hoverDelay={0} disabled />);
    fireEvent.mouseEnter(container);
    expect(container).toMatchSnapshot();
  });
});
