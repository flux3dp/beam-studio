import React from 'react';

import { render, waitFor } from '@testing-library/react';

const mockSetStlEngravingParam = jest.fn();

jest.mock('@core/app/stores/storageStore', () => ({
  useStorageStore: (selector: (state: { isInch: boolean }) => unknown) => selector({ isInch: false }),
}));
jest.mock('@core/app/svgedit/stl/engravingParams', () => ({
  getStlEngravingParams: () => ({ layerHeight: 0.1, mode: 'line', pointSpacing: 0.1 }),
  setStlEngravingParam: (...args: unknown[]) => mockSetStlEngravingParam(...args),
}));
jest.mock('@core/app/widgets/UnitInput', () => ({ id }: { id: string }) => <div data-testid={id} />);
jest.mock('@core/helpers/is-dev', () => ({ todo: jest.fn() }));
jest.mock('@core/helpers/useI18n', () => () => ({
  inner_engraving_settings: {
    engraving_mode: 'Mode',
    fill: 'Fill',
    layer_height: 'Layer Height',
    mode_dot: 'Dot',
    mode_line: 'Line',
    point_spacing: 'Point Spacing',
  },
}));

import ThreeDOptions from './ThreeDOptions';

describe('ThreeDOptions', () => {
  test('shows the common 3D processing controls', () => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const { getByText } = render(<ThreeDOptions elem={elem} />);

    expect(getByText('Mode')).toHaveClass('label');
    expect(getByText('Layer Height')).toHaveClass('label');
  });

  test('can hide engraving mode for a photo plane', () => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    const { getByText, queryByText } = render(<ThreeDOptions elem={elem} hideEngravingMode />);

    expect(queryByText('Mode')).not.toBeInTheDocument();
    expect(getByText('Layer Height')).toBeInTheDocument();
  });

  test('derives photo point mode from the shading attribute', async () => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'image');

    elem.setAttribute('data-stl-photo', '1');

    const { getByTestId, queryByTestId } = render(<ThreeDOptions elem={elem} hideEngravingMode />);

    expect(queryByTestId('stl-point-spacing')).not.toBeInTheDocument();

    elem.setAttribute('data-shading', 'true');

    await waitFor(() => expect(getByTestId('stl-point-spacing')).toBeInTheDocument());

    elem.setAttribute('data-shading', 'false');

    await waitFor(() => expect(queryByTestId('stl-point-spacing')).not.toBeInTheDocument());
  });
});
