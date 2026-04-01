import React from 'react';
import { fireEvent, render } from '@testing-library/react';

const mockUpdateState = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: jest.fn(() => false),
}));

jest.mock('../../useKeychainShapeStore', () => {
  const holes: Record<string, any> = {
    'hole-bottom': { diameter: 3, enabled: true, offset: 0, position: 0, thickness: 1 },
    'hole-top': { diameter: 3, enabled: true, offset: 0, position: 0, thickness: 1 },
  };
  const state = { holes };

  return {
    __esModule: true,
    default: Object.assign(
      (selector: any) => selector({ state, updateState: mockUpdateState }),
      { getState: () => ({ state, updateState: mockUpdateState }) },
    ),
  };
});

jest.mock('./HoleGroup', () => ({ defaults, hole, id, onHoleChange }: any) => (
  <div data-testid={`hole-group-${id}`}>
    <span>enabled:{String(hole.enabled)}</span>
    <button data-testid={`change-${id}`} onClick={() => onHoleChange({ diameter: 5 })}>change</button>
    <button data-testid={`toggle-${id}`} onClick={() => onHoleChange({ enabled: false })}>toggle</button>
  </div>
));

import type { KeyChainCategory } from '../../types';

import OptionsPanel from './OptionsPanel';

describe('OptionsPanel', () => {
  const category: KeyChainCategory = {
    defaultViewBox: { height: 600, width: 300, x: 0, y: 0 },
    id: 'rectangle',
    nameKey: 'types.rectangle',
    options: [
      { defaults: { diameter: 3, enabled: true, offset: 0, position: 0, thickness: 1 }, id: 'hole-top', startPositionRef: 'topCenter' as any, type: 'hole' },
      { defaults: { diameter: 3, enabled: true, offset: 0, position: 0, thickness: 1 }, id: 'hole-bottom', startPositionRef: 'bottomCenter' as any, type: 'hole' },
    ],
    svgContent: '<svg></svg>',
    thumbnail: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render category name from translations', () => {
    const { getByText } = render(<OptionsPanel category={category} />);
    expect(getByText('Rectangle')).toBeInTheDocument();
  });

  it('should render a HoleGroup for each hole option', () => {
    const { getByTestId } = render(<OptionsPanel category={category} />);
    expect(getByTestId('hole-group-hole-top')).toBeInTheDocument();
    expect(getByTestId('hole-group-hole-bottom')).toBeInTheDocument();
  });

  it('should call updateState when a hole changes', () => {
    const { getByTestId } = render(<OptionsPanel category={category} />);
    fireEvent.click(getByTestId('change-hole-top'));
    expect(mockUpdateState).toHaveBeenCalledWith({
      holes: expect.objectContaining({
        'hole-top': expect.objectContaining({ diameter: 5 }),
      }),
    });
  });

  it('should preserve other holes when updating one', () => {
    const { getByTestId } = render(<OptionsPanel category={category} />);
    fireEvent.click(getByTestId('toggle-hole-top'));
    const call = mockUpdateState.mock.calls[0][0];

    expect(call.holes['hole-top'].enabled).toBe(false);
    expect(call.holes['hole-bottom']).toEqual({ diameter: 3, enabled: true, offset: 0, position: 0, thickness: 1 });
  });

  it('should resolve nameKey fallback for unknown keys', () => {
    const unknownCategory = { ...category, nameKey: 'unknown-key' };
    const { getByText } = render(<OptionsPanel category={unknownCategory} />);
    expect(getByText('unknown-key')).toBeInTheDocument();
  });

  it('should not render hole groups for non-hole options', () => {
    const noHolesCategory = { ...category, options: [] };
    const { queryByTestId } = render(<OptionsPanel category={noHolesCategory} />);
    expect(queryByTestId('hole-group-hole-top')).not.toBeInTheDocument();
  });
});
