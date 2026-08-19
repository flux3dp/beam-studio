import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import type { Material, MaterialVariant } from '@core/interfaces/IMaterial';

import MaterialCard from './MaterialCard';

const material: Material = {
  category: 'acrylic',
  id: 'glitter',
  name: 'Glitter Acrylic',
  presets: [],
  tags: ['Premium', 'FLUX Shop'],
};

const mmVariant: MaterialVariant = { id: 'glitter-3mm', thicknessNum: 3, thicknessUnit: 'mm' };

describe('MaterialCard', () => {
  const onOpen = jest.fn();
  const onToggleFavorite = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  test('single variant shows its thickness badge', () => {
    const { container, getByText } = render(
      <MaterialCard
        isFavorite={false}
        material={material}
        onOpen={onOpen}
        onToggleFavorite={onToggleFavorite}
        variants={[mmVariant]}
      />,
    );

    expect(getByText('3 mm')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  test('inch variant shows its fraction; several variants show the count instead', () => {
    const { getByText, queryByText, rerender } = render(
      <MaterialCard
        isFavorite
        material={material}
        onOpen={onOpen}
        onToggleFavorite={onToggleFavorite}
        variants={[{ id: 'v1', thicknessDen: 8, thicknessNum: 1, thicknessUnit: 'inch' }]}
      />,
    );

    expect(getByText('⅛″')).toBeInTheDocument();

    rerender(
      <MaterialCard
        isFavorite
        material={material}
        onOpen={onOpen}
        onToggleFavorite={onToggleFavorite}
        variants={[
          mmVariant,
          { id: 'v2', thicknessNum: 5, thicknessUnit: 'mm' },
          { id: 'v3', thicknessNum: 7, thicknessUnit: 'mm' },
        ]}
      />,
    );

    expect(getByText('3 variants')).toBeInTheDocument();
    expect(queryByText('3 mm')).not.toBeInTheDocument();
  });

  test('badge hidden without variants (D18)', () => {
    const { queryByText } = render(
      <MaterialCard
        isFavorite={false}
        material={material}
        onOpen={onOpen}
        onToggleFavorite={onToggleFavorite}
        variants={[]}
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
        variants={[mmVariant]}
      />,
    );

    fireEvent.click(getByTestId('favorite-toggle'));
    expect(onToggleFavorite).toHaveBeenCalledWith('glitter');
    expect(onOpen).not.toHaveBeenCalled();

    fireEvent.click(getByTestId('material-card-glitter'));
    expect(onOpen).toHaveBeenCalledWith('glitter');
  });
});
