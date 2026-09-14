import React from 'react';

import { act, fireEvent, render, waitFor } from '@testing-library/react';

const mockSetStlEngravingParam = jest.fn();
const mockApplyPhotoPointCloud = jest.fn();
const mockGeneratePhotoPointCloud = jest.fn();
let mockParams = { layerHeight: 0.1, minLayerHeight: null as null | number, mode: 'line', pointSpacing: 0.1 };

jest.mock('@core/app/stores/storageStore');
jest.mock('@core/app/svgedit/stl/engravingParams', () => ({
  getStlEngravingParams: () => ({ ...mockParams }),
  setStlEngravingParam: (...args: unknown[]) => mockSetStlEngravingParam(...args),
}));
jest.mock('@core/app/svgedit/stl/photoPointCloud', () => ({
  applyPhotoPointCloud: (...args: unknown[]) => mockApplyPhotoPointCloud(...args),
}));
jest.mock('@core/app/svgedit/stl/photoPointCloudGenerator', () => ({
  generatePhotoPointCloud: (...args: unknown[]) => mockGeneratePhotoPointCloud(...args),
}));
jest.mock(
  '@core/app/widgets/UnitInput',
  () =>
    ({ id, max, min, onChange }: { id: string; max: number; min: number; onChange: (value: number) => void }) => (
      <input
        data-max={max}
        data-min={min}
        data-testid={id}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    ),
);
jest.mock('@core/helpers/is-dev', () => ({ isUvDev2: () => true }));
jest.mock('@core/helpers/useI18n', () => () => ({
  inner_engraving_settings: {
    adaptive_layer_height: 'Adaptive Layer Height',
    adaptive_layer_height_hint: 'Adaptive hint',
    engraving_mode: 'Mode',
    fill: 'Fill',
    generate_test_point_cloud: 'Generate Test Point Cloud',
    layer_height: 'Layer Height',
    layer_height_hint_dot_fill: 'Dot fill hint',
    layer_height_hint_line: 'Line hint',
    min_layer_height: 'Minimum Layer Height',
    min_layer_height_hint: 'Minimum hint',
    mode_dot: 'Dot',
    mode_line: 'Line',
    point_spacing: 'Point Spacing',
  },
}));

import ThreeDOptions from './ThreeDOptions';

describe('ThreeDOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { layerHeight: 0.1, minLayerHeight: null, mode: 'line', pointSpacing: 0.1 };
  });

  test('shows the common 3D processing controls', () => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const { getByText } = render(<ThreeDOptions elem={elem} />);

    expect(getByText('Mode').parentElement).toHaveClass('label');
    expect(getByText('Layer Height').parentElement).toHaveClass('label');
    expect(getByText('Adaptive Layer Height').parentElement).toHaveClass('label');
  });

  test('hides layer height for unfilled dot mode but shows it for filled dot mode', async () => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

    elem.setAttribute('fill', 'none');
    mockParams = { ...mockParams, mode: 'dot' };

    const { getByText, queryByText } = render(<ThreeDOptions elem={elem} />);

    expect(queryByText('Layer Height')).not.toBeInTheDocument();
    expect(queryByText('Adaptive Layer Height')).not.toBeInTheDocument();

    await act(async () => elem.setAttribute('fill', '#000000'));

    expect(getByText('Layer Height')).toBeInTheDocument();
    expect(queryByText('Adaptive Layer Height')).not.toBeInTheDocument();
  });

  test('opts into adaptive slicing and constrains the minimum layer height', async () => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const { getByRole, getByTestId } = render(<ThreeDOptions elem={elem} />);

    fireEvent.click(getByRole('switch'));
    expect(mockSetStlEngravingParam).toHaveBeenCalledWith(elem, 'data-stl-min-layer-height', 0.05);

    mockParams = { ...mockParams, minLayerHeight: 0.04 };
    await act(async () => elem.setAttribute('data-stl-min-layer-height', '0.04'));

    await waitFor(() => expect(getByTestId('stl-layer-height')).toHaveAttribute('data-min', '0.041'));
    expect(getByTestId('stl-min-layer-height')).toHaveAttribute('data-max', '0.099');

    fireEvent.change(getByTestId('stl-min-layer-height'), { target: { value: '0.1' } });
    expect(mockSetStlEngravingParam).not.toHaveBeenCalledWith(elem, 'data-stl-min-layer-height', 0.1);
  });

  test('can hide engraving mode for a photo plane', () => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'image');

    elem.setAttribute('data-stl-photo', '1');

    const { getByText, queryByText } = render(<ThreeDOptions elem={elem} hideEngravingMode />);

    expect(queryByText('Mode')).not.toBeInTheDocument();
    expect(getByText('Layer Height')).toBeInTheDocument();
    expect(queryByText('Adaptive Layer Height')).not.toBeInTheDocument();
  });

  test('derives photo point mode from the shading attribute', async () => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'image');

    elem.setAttribute('data-stl-photo', '1');

    const { getByTestId, queryByTestId } = render(<ThreeDOptions elem={elem} hideEngravingMode />);

    expect(queryByTestId('stl-point-spacing')).not.toBeInTheDocument();

    await act(async () => elem.setAttribute('data-shading', 'true'));

    await waitFor(() => expect(getByTestId('stl-point-spacing')).toBeInTheDocument());

    await act(async () => elem.setAttribute('data-shading', 'false'));

    await waitFor(() => expect(queryByTestId('stl-point-spacing')).not.toBeInTheDocument());
  });

  test('generates and applies a frontend test point cloud for a photo plane', async () => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    const buffer = new ArrayBuffer(16);

    elem.id = 'photo';
    elem.setAttribute('data-stl-photo', '1');
    mockGeneratePhotoPointCloud.mockResolvedValue(buffer);

    const { getByRole } = render(<ThreeDOptions elem={elem} hideEngravingMode />);

    fireEvent.click(getByRole('button', { name: 'Generate Test Point Cloud' }));

    await waitFor(() =>
      expect(mockGeneratePhotoPointCloud).toHaveBeenCalledWith(elem, {
        layerHeight: 0.1,
        minLayerHeight: null,
        mode: 'line',
        pointSpacing: 0.1,
      }),
    );
    expect(mockApplyPhotoPointCloud).toHaveBeenCalledWith('photo', buffer);
  });
});
