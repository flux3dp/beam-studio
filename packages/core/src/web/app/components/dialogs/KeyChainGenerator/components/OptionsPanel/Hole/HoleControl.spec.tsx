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

jest.mock('../Controls/NumberControl', () => ({ label, onChange, value }: any) => (
  <div data-testid={`slider-${label}`}>
    <span>value:{value}</span>
    <input data-testid={`input-${label}`} onChange={(e) => onChange(Number(e.target.value))} />
  </div>
));

const mockHoles: Record<string, any> = {
  'hole-top': { diameter: 3, enabled: true, offset: 0, position: 0, thickness: 1, type: 'ring' },
};

const mockApplyOptions = jest.fn();

jest.mock('../../../useKeychainShapeStore', () => ({
  __esModule: true,
  default: Object.assign((selector: any) => selector({ state: { holes: mockHoles } }), {
    getState: () => ({
      applyOptions: mockApplyOptions,
      state: { holes: mockHoles },
      updateState: mockUpdateState,
    }),
  }),
}));

import type { HoleOptionDef, HoleOptionValues } from '../../../types';

import HoleControl from './HoleControl';

describe('HoleControl', () => {
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockHoles['hole-top'] = { ...defaults };
  });

  it('should render all four slider controls when enabled', () => {
    const { getByTestId } = render(<HoleControl optionDef={defaultOptionDef} />);

    expect(getByTestId('slider-Diameter')).toBeInTheDocument();
    expect(getByTestId('slider-Position')).toBeInTheDocument();
    expect(getByTestId('slider-Offset')).toBeInTheDocument();
    expect(getByTestId('slider-Thickness')).toBeInTheDocument();
  });

  it('should pass correct values to sliders', () => {
    mockHoles['hole-top'] = { ...defaults, diameter: 4, position: 50 };

    const { getByTestId } = render(<HoleControl optionDef={defaultOptionDef} />);

    expect(getByTestId('slider-Diameter')).toHaveTextContent('value:4');
    expect(getByTestId('slider-Position')).toHaveTextContent('value:50');
  });

  it('should clamp offset when it exceeds maxOffset', () => {
    // maxOffset = diameter/2 + thickness - 0.5 = 3/2 + 1 - 0.5 = 2
    mockHoles['hole-top'] = { ...defaults, offset: 10 };

    render(<HoleControl optionDef={defaultOptionDef} />);
    expect(mockUpdateState).toHaveBeenCalledWith({
      holes: expect.objectContaining({
        'hole-top': expect.objectContaining({ offset: 2 }),
      }),
    });
  });

  it('should clamp offset when it is below minOffset', () => {
    // minOffset (ring) = -(diameter/2) - thickness + 0.5 = -1.5 - 1 + 0.5 = -2
    mockHoles['hole-top'] = { ...defaults, offset: -10 };

    render(<HoleControl optionDef={defaultOptionDef} />);
    expect(mockUpdateState).toHaveBeenCalledWith({
      holes: expect.objectContaining({
        'hole-top': expect.objectContaining({ offset: -2 }),
      }),
    });
  });

  it('should not clamp offset when within range', () => {
    mockHoles['hole-top'] = { ...defaults, offset: 1 };

    render(<HoleControl optionDef={defaultOptionDef} />);
    expect(mockUpdateState).not.toHaveBeenCalled();
  });

  describe('fieldVisibility', () => {
    it('should hide fields when fieldVisibility excludes current type', () => {
      mockHoles['hole-top'] = { ...defaults, type: 'punch' };

      const optionDef: HoleOptionDef = {
        ...defaultOptionDef,
        fieldVisibility: { offset: ['ring'], position: ['ring'] },
      };

      const { queryByTestId } = render(<HoleControl optionDef={optionDef} />);

      expect(queryByTestId('slider-Position')).not.toBeInTheDocument();
      expect(queryByTestId('slider-Offset')).not.toBeInTheDocument();
      expect(queryByTestId('slider-Diameter')).toBeInTheDocument();
    });

    it('should show fields when fieldVisibility includes current type', () => {
      mockHoles['hole-top'] = { ...defaults, type: 'ring' };

      const optionDef: HoleOptionDef = {
        ...defaultOptionDef,
        fieldVisibility: { offset: ['ring'], position: ['ring'] },
      };

      const { getByTestId } = render(<HoleControl optionDef={optionDef} />);

      expect(getByTestId('slider-Position')).toBeInTheDocument();
      expect(getByTestId('slider-Offset')).toBeInTheDocument();
    });

    it('should show all fields when fieldVisibility is undefined', () => {
      const { getByTestId } = render(<HoleControl optionDef={defaultOptionDef} />);

      expect(getByTestId('slider-Diameter')).toBeInTheDocument();
      expect(getByTestId('slider-Position')).toBeInTheDocument();
      expect(getByTestId('slider-Offset')).toBeInTheDocument();
      expect(getByTestId('slider-Thickness')).toBeInTheDocument();
    });

    it('should hide type select when fieldVisibility excludes current type', () => {
      mockHoles['hole-top'] = { ...defaults, type: 'punch' };

      const optionDef: HoleOptionDef = {
        ...defaultOptionDef,
        fieldVisibility: { type: ['ring'] },
      };

      const { queryByTestId } = render(<HoleControl optionDef={optionDef} />);

      expect(queryByTestId('select')).not.toBeInTheDocument();
    });
  });
});
