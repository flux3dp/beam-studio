import React from 'react';
import { render } from '@testing-library/react';

jest.mock('@core/app/widgets/AntdSelect', () => ({ onChange, options, value }: any) => (
  <select data-testid="select" onChange={(e) => onChange?.(e.target.value)} value={value}>
    {options?.map((o: any) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
));

jest.mock('./GroupControl', () => ({ children, enabled, onToggle }: any) => (
  <div data-testid="group-control">
    <button data-testid="switch" onClick={() => onToggle?.(!enabled)}>
      {String(enabled)}
    </button>
    {enabled && <div data-testid="group-content">{children}</div>}
  </div>
));

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
    type: 'ring',
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
    expect(defaultProps.onHoleChange).toHaveBeenCalledWith('hole-top', { enabled: false });
  });

  it('should clamp offset when it exceeds maxOffset', () => {
    // maxOffset = diameter/2 + thickness - 0.5 = 3/2 + 1 - 0.5 = 2
    const hole = { ...defaults, offset: 10 };

    render(<HoleGroup {...defaultProps} hole={hole} />);
    expect(defaultProps.onHoleChange).toHaveBeenCalledWith('hole-top', { offset: 2 });
  });

  it('should clamp offset when it is below minOffset', () => {
    // minOffset (ring) = -(diameter/2) - thickness + 0.5 = -1.5 - 1 + 0.5 = -2
    const hole = { ...defaults, offset: -10 };

    render(<HoleGroup {...defaultProps} hole={hole} />);
    expect(defaultProps.onHoleChange).toHaveBeenCalledWith('hole-top', { offset: -2 });
  });

  it('should not clamp offset when within range', () => {
    const hole = { ...defaults, offset: 1 };

    render(<HoleGroup {...defaultProps} hole={hole} />);
    expect(defaultProps.onHoleChange).not.toHaveBeenCalled();
  });
});
