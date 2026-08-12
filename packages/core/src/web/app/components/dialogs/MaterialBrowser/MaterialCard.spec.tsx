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
  thicknessNum: 3,
  thicknessUnit: 'mm',
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
        variantCount={1}
      />,
    );

    expect(getByText('3 mm')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  test('inch material shows its fraction; multiple variants add the count', () => {
    const { getByText } = render(
      <MaterialCard
        isFavorite
        material={{ ...material, thicknessDen: 8, thicknessNum: 1, thicknessUnit: 'inch' }}
        onOpen={onOpen}
        onToggleFavorite={onToggleFavorite}
        variantCount={3}
      />,
    );

    expect(getByText('⅛″ · 3 variants')).toBeInTheDocument();
  });

  test('dimmed card carries the de-emphasis class', () => {
    const { getByTestId } = render(
      <MaterialCard
        dimmed
        isFavorite={false}
        material={material}
        onOpen={onOpen}
        onToggleFavorite={onToggleFavorite}
        variantCount={1}
      />,
    );

    expect(getByTestId('material-card-glitter').className).toContain('dimmed');
  });

  test('badge hidden for unset thickness (D18)', () => {
    const { queryByText } = render(
      <MaterialCard
        isFavorite={false}
        material={{ ...material, thicknessNum: undefined, thicknessUnit: undefined }}
        onOpen={onOpen}
        onToggleFavorite={onToggleFavorite}
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
