import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

const mockSetStlEngravingParam = jest.fn();
const mockApplyPhotoPointCloud = jest.fn();
const mockGeneratePhotoPointCloud = jest.fn();

jest.mock('@core/app/stores/storageStore', () => ({
  useStorageStore: (selector: (state: { isInch: boolean }) => unknown) => selector({ isInch: false }),
}));
jest.mock('@core/app/svgedit/stl/engravingParams', () => ({
  getStlEngravingParams: () => ({ layerHeight: 0.1, mode: 'line', pointSpacing: 0.1 }),
  setStlEngravingParam: (...args: unknown[]) => mockSetStlEngravingParam(...args),
}));
jest.mock('@core/app/svgedit/stl/photoPointCloud', () => ({
  applyPhotoPointCloud: (...args: unknown[]) => mockApplyPhotoPointCloud(...args),
}));
jest.mock('@core/app/svgedit/stl/photoPointCloudGenerator', () => ({
  generatePhotoPointCloud: (...args: unknown[]) => mockGeneratePhotoPointCloud(...args),
}));
jest.mock('@core/app/widgets/UnitInput', () => ({ id }: { id: string }) => <div data-testid={id} />);
jest.mock('@core/helpers/is-dev', () => ({ todo: jest.fn() }));
jest.mock('@core/helpers/useI18n', () => () => ({
  inner_engraving_settings: {
    engraving_mode: 'Mode',
    fill: 'Fill',
    generate_test_point_cloud: 'Generate Test Point Cloud',
    layer_height: 'Layer Height',
    mode_dot: 'Dot',
    mode_line: 'Line',
    point_spacing: 'Point Spacing',
  },
}));

import ThreeDOptions from './ThreeDOptions';

describe('ThreeDOptions', () => {
  beforeEach(() => {
    mockApplyPhotoPointCloud.mockReset();
    mockGeneratePhotoPointCloud.mockReset();
  });

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
        mode: 'line',
        pointSpacing: 0.1,
      }),
    );
    expect(mockApplyPhotoPointCloud).toHaveBeenCalledWith('photo', buffer);
  });
});
