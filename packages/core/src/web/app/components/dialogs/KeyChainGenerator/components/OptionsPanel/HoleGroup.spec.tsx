import React from 'react';
import { render } from '@testing-library/react';

const mockUpdateState = jest.fn();

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

const mockHoles: Record<string, any> = {
  'hole-top': { diameter: 3, enabled: true, offset: 0, position: 0, thickness: 1, type: 'ring' },
};

jest.mock('../../useKeychainShapeStore', () => ({
  __esModule: true,
  default: Object.assign((selector: any) => selector({ state: { holes: mockHoles } }), {
    getState: () => ({ state: { holes: mockHoles }, updateState: mockUpdateState }),
  }),
}));

import type { HoleOptionDef, HoleOptionValues } from '../../types';

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

  const defaultOptionDef: HoleOptionDef = {
    defaults,
    id: 'hole-top',
    startPositionRef: 'topCenter',
    type: 'hole',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockHoles['hole-top'] = { ...defaults };
  });

  it('should render all four slider controls when enabled', () => {
    const { getByTestId } = render(<HoleGroup optionDef={defaultOptionDef} />);

    expect(getByTestId('slider-Diameter')).toBeInTheDocument();
    expect(getByTestId('slider-Position')).toBeInTheDocument();
    expect(getByTestId('slider-Offset')).toBeInTheDocument();
    expect(getByTestId('slider-Thickness')).toBeInTheDocument();
  });

  it('should pass correct values to sliders', () => {
    mockHoles['hole-top'] = { ...defaults, diameter: 4, position: 50 };

    const { getByTestId } = render(<HoleGroup optionDef={defaultOptionDef} />);

    expect(getByTestId('slider-Diameter')).toHaveTextContent('value:4');
    expect(getByTestId('slider-Position')).toHaveTextContent('value:50');
  });

  it('should call updateState when toggle is clicked', () => {
    const { getByTestId } = render(<HoleGroup optionDef={defaultOptionDef} />);

    getByTestId('switch').click();
    expect(mockUpdateState).toHaveBeenCalledWith({
      holes: expect.objectContaining({
        'hole-top': expect.objectContaining({ enabled: false }),
      }),
    });
  });

  it('should clamp offset when it exceeds maxOffset', () => {
    // maxOffset = diameter/2 + thickness - 0.5 = 3/2 + 1 - 0.5 = 2
    mockHoles['hole-top'] = { ...defaults, offset: 10 };

    render(<HoleGroup optionDef={defaultOptionDef} />);
    expect(mockUpdateState).toHaveBeenCalledWith({
      holes: expect.objectContaining({
        'hole-top': expect.objectContaining({ offset: 2 }),
      }),
    });
  });

  it('should clamp offset when it is below minOffset', () => {
    // minOffset (ring) = -(diameter/2) - thickness + 0.5 = -1.5 - 1 + 0.5 = -2
    mockHoles['hole-top'] = { ...defaults, offset: -10 };

    render(<HoleGroup optionDef={defaultOptionDef} />);
    expect(mockUpdateState).toHaveBeenCalledWith({
      holes: expect.objectContaining({
        'hole-top': expect.objectContaining({ offset: -2 }),
      }),
    });
  });

  it('should not clamp offset when within range', () => {
    mockHoles['hole-top'] = { ...defaults, offset: 1 };

    render(<HoleGroup optionDef={defaultOptionDef} />);
    expect(mockUpdateState).not.toHaveBeenCalled();
  });
});
