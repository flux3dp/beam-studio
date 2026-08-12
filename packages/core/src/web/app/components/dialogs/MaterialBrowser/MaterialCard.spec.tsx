import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import type { Material } from '@core/interfaces/IMaterial';

import MaterialCard from './MaterialCard';

const material: Material = {
  category: 'acrylic',
  id: 'glitter',
  name: 'Glitter Acrylic',
  presets: [],
  tags: ['Premium', 'FLUX Shop'],
  thicknessInch: 0.125,
  thicknessMm: 3,
};

describe('MaterialCard', () => {
  const onOpen = jest.fn();
  const onToggleFavorite = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  test('renders with metric thickness badge', () => {
    const { container, getByText } = render(
      <MaterialCard
        isFavorite={false}
        material={material}
        onOpen={onOpen}
        onToggleFavorite={onToggleFavorite}
        region="tw"
        variantCount={1}
      />,
    );

    expect(getByText('3 mm')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  test('US region shows inch fraction; multiple variants add the count', () => {
    const { getByText } = render(
      <MaterialCard
        isFavorite
        material={material}
        onOpen={onOpen}
        onToggleFavorite={onToggleFavorite}
        region="us"
        variantCount={3}
      />,
    );

    expect(getByText('⅛″ · 3 variants')).toBeInTheDocument();
  });

  test('badge hidden for unset thickness (D18)', () => {
    const { queryByText } = render(
      <MaterialCard
        isFavorite={false}
        material={{ ...material, thicknessInch: undefined, thicknessMm: undefined }}
        onOpen={onOpen}
        onToggleFavorite={onToggleFavorite}
        region="tw"
        variantCount={1}
      />,
    );

    expect(queryByText('3 mm')).not.toBeInTheDocument();
  });

  test('click opens detail; star toggles favorite without opening', () => {
    const { getByTestId } = render(
      <MaterialCard
        isFavorite={false}
        material={material}
        onOpen={onOpen}
        onToggleFavorite={onToggleFavorite}
        region="tw"
        variantCount={1}
      />,
    );

    fireEvent.click(getByTestId('favorite-toggle'));
    expect(onToggleFavorite).toHaveBeenCalledWith('glitter');
    expect(onOpen).not.toHaveBeenCalled();

    fireEvent.click(getByTestId('material-card-glitter'));
    expect(onOpen).toHaveBeenCalledWith('glitter');
  });
});
