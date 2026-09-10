const mockApplyPresetRow = jest.fn();
const mockShowMovePresetModal = jest.fn();
const mockRestorePreset = jest.fn();

jest.mock('../utils/applyPresetRow', () => ({
  applyPresetRow: (...args: unknown[]) => mockApplyPresetRow(...args),
}));
jest.mock('../editors', () => ({
  showMovePresetModal: (...args: unknown[]) => mockShowMovePresetModal(...args),
}));
jest.mock('@core/app/stores/materialStore', () => ({
  useMaterialStore: { getState: () => ({ restorePreset: mockRestorePreset }) },
}));

import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { ResolvedPresetRow } from '@core/helpers/api/material-catalog/selectors';

import PresetRow from './PresetRow';

const baseRow: ResolvedPresetRow = {
  displayName: 'Cutting',
  isDisabled: false,
  legacyKey: 'wood_3mm_cutting',
  materialId: 'wood-3mm',
  preset: { id: 'wood_3mm_cutting', legacyKey: 'wood_3mm_cutting', origin: 'default', settings: {} },
  presetId: 'wood_3mm_cutting',
  state: 'default',
  values: { dpi: 'medium', power: 55, repeat: 1, speed: 7 },
};

const context = { model: 'fbb2', module: LayerModule.LASER_UNIVERSAL } as const;

describe('PresetRow', () => {
  beforeEach(() => jest.clearAllMocks());

  test('default preset renders pills and state tag', () => {
    const { container, getByText } = render(<PresetRow context={context} row={baseRow} />);

    expect(getByText('Default')).toBeInTheDocument();
    expect(getByText('55%')).toBeInTheDocument();
    expect(getByText('250')).toBeInTheDocument(); // DPI pill shows the numeric value
    expect(container).toMatchSnapshot();
  });

  test('customized and disabled states', () => {
    const { getByText } = render(
      <PresetRow context={context} row={{ ...baseRow, isDisabled: true, state: 'customized' }} />,
    );

    expect(getByText('Customized')).toBeInTheDocument();
    expect(getByText('Disabled')).toBeInTheDocument();
    expect(getByText('Apply').closest('button')).toBeDisabled();
  });

  test('apply hands the row and module to applyPresetRow', () => {
    const { getByText } = render(<PresetRow context={context} row={baseRow} />);

    fireEvent.click(getByText('Apply'));
    expect(mockApplyPresetRow).toHaveBeenCalledWith(baseRow, LayerModule.LASER_UNIVERSAL);
  });

  test('user preset menu offers move and delete', async () => {
    const userRow: ResolvedPresetRow = { ...baseRow, state: 'user' };
    const { findByText, getByTestId } = render(<PresetRow context={context} row={userRow} />);

    fireEvent.click(getByTestId('preset-menu-wood_3mm_cutting'));

    fireEvent.click(await findByText('Move to material…'));
    expect(mockShowMovePresetModal).toHaveBeenCalledWith('wood_3mm_cutting');
  });

  test('customized preset menu offers restore', async () => {
    const customizedRow: ResolvedPresetRow = { ...baseRow, state: 'customized' };
    const { findByText, getByTestId } = render(<PresetRow context={context} row={customizedRow} />);

    fireEvent.click(getByTestId('preset-menu-wood_3mm_cutting'));

    fireEvent.click(await findByText('Restore FLUX default'));
    expect(mockRestorePreset).toHaveBeenCalledWith('wood_3mm_cutting');
  });
});
