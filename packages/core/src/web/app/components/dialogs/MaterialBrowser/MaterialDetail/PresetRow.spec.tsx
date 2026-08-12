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
  const handlers = {
    onApply: jest.fn(),
    onDelete: jest.fn(),
    onEdit: jest.fn(),
    onMove: jest.fn(),
    onRestore: jest.fn(),
    onToggleDisabled: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  test('default preset renders pills, state tag, and DPI tag', () => {
    const { container, getByText, queryByText } = render(<PresetRow context={context} row={baseRow} {...handlers} />);

    expect(getByText('Default')).toBeInTheDocument();
    expect(getByText('55%')).toBeInTheDocument();
    // Declared dpi shows as a Tag beside the name; there is no DPI pill
    expect(getByText('250 DPI')).toBeInTheDocument();
    expect(queryByText('250')).not.toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  test('no DPI tag without a declared dpi', () => {
    const { queryByText } = render(
      <PresetRow context={context} row={{ ...baseRow, values: { power: 55, speed: 7 } }} {...handlers} />,
    );

    expect(queryByText(/DPI/)).not.toBeInTheDocument();
  });

  test('customized and disabled states', () => {
    const { getByText } = render(
      <PresetRow context={context} row={{ ...baseRow, isDisabled: true, state: 'customized' }} {...handlers} />,
    );

    expect(getByText('Customized')).toBeInTheDocument();
    expect(getByText('Disabled')).toBeInTheDocument();
    expect(getByText('Apply').closest('button')).toBeDisabled();
  });

  test('apply fires with the row', () => {
    const { getByText } = render(<PresetRow context={context} row={baseRow} {...handlers} />);

    fireEvent.click(getByText('Apply'));
    expect(handlers.onApply).toHaveBeenCalledWith(baseRow);
  });

  test('user preset menu offers move and delete', async () => {
    const userRow: ResolvedPresetRow = { ...baseRow, state: 'user' };
    const { findByText, getByTestId } = render(<PresetRow context={context} row={userRow} {...handlers} />);

    fireEvent.click(getByTestId('preset-menu-wood_3mm_cutting'));

    fireEvent.click(await findByText('Move to material…'));
    expect(handlers.onMove).toHaveBeenCalledWith(userRow);
  });

  test('customized preset menu offers restore', async () => {
    const customizedRow: ResolvedPresetRow = { ...baseRow, state: 'customized' };
    const { findByText, getByTestId } = render(<PresetRow context={context} row={customizedRow} {...handlers} />);

    fireEvent.click(getByTestId('preset-menu-wood_3mm_cutting'));

    fireEvent.click(await findByText('Restore FLUX default'));
    expect(handlers.onRestore).toHaveBeenCalledWith(customizedRow);
  });
});
