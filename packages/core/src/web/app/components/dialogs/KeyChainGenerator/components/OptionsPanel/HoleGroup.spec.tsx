import React from 'react';
import { render } from '@testing-library/react';

jest.mock('antd', () => ({
  Collapse: ({ activeKey, items }: any) => (
    <div data-testid="collapse">
      {items.map((item: any) => (
        <div key={item.key}>
          <div data-testid="collapse-header">{item.label}</div>
          {(activeKey || []).includes(item.key) && <div data-testid="collapse-content">{item.children}</div>}
        </div>
      ))}
    </div>
  ),
  Switch: ({ checked, onChange }: any) => (
    <button data-testid="switch" onClick={() => onChange?.(!checked)}>
      {String(checked)}
    </button>
  ),
}));

jest.mock('./NumberControl', () => ({ label, onChange, value }: any) => (
  <div data-testid={`slider-${label}`}>
    <span>value:{value}</span>
    <input data-testid={`input-${label}`} onChange={(e) => onChange(Number(e.target.value))} />
  </div>
));

import type { HoleOptionValues } from '../../types';

import HoleGroup from './HoleGroup';

describe('HoleGroup', () => {
  const defaults: HoleOptionValues = {
    diameter: 3,
    enabled: true,
    offset: 0,
    position: 0,
    thickness: 1,
  };

  const defaultProps = {
    defaults,
    hole: { ...defaults },
    id: 'hole-top',
    onHoleChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all four slider controls when enabled', () => {
    const { getByTestId } = render(<HoleGroup {...defaultProps} />);

    expect(getByTestId('slider-Diameter')).toBeInTheDocument();
    expect(getByTestId('slider-Position')).toBeInTheDocument();
    expect(getByTestId('slider-Offset')).toBeInTheDocument();
    expect(getByTestId('slider-Thickness')).toBeInTheDocument();
  });

  it('should pass correct values to sliders', () => {
    const hole = { ...defaults, diameter: 4, position: 50 };
    const { getByTestId } = render(<HoleGroup {...defaultProps} hole={hole} />);

    expect(getByTestId('slider-Diameter')).toHaveTextContent('value:4');
    expect(getByTestId('slider-Position')).toHaveTextContent('value:50');
  });

  it('should call onHoleChange when toggle is clicked', () => {
    const { getByTestId } = render(<HoleGroup {...defaultProps} />);

    getByTestId('switch').click();
    expect(defaultProps.onHoleChange).toHaveBeenCalledWith({ enabled: false });
  });

  it('should clamp offset when it exceeds maxOffset', () => {
    // maxOffset = diameter/2 + thickness - 0.5 = 3/2 + 1 - 0.5 = 2
    const hole = { ...defaults, offset: 10 };

    render(<HoleGroup {...defaultProps} hole={hole} />);
    expect(defaultProps.onHoleChange).toHaveBeenCalledWith({ offset: 2 });
  });

  it('should clamp offset when it is below minOffset', () => {
    // minOffset = -2 * diameter = -6
    const hole = { ...defaults, offset: -10 };

    render(<HoleGroup {...defaultProps} hole={hole} />);
    expect(defaultProps.onHoleChange).toHaveBeenCalledWith({ offset: -6 });
  });

  it('should not clamp offset when within range', () => {
    const hole = { ...defaults, offset: 1 };

    render(<HoleGroup {...defaultProps} hole={hole} />);
    expect(defaultProps.onHoleChange).not.toHaveBeenCalled();
  });
});
