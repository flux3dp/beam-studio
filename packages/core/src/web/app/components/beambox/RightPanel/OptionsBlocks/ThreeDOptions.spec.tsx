import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

const mockApplyPhotoPointCloud = jest.fn();
const mockGeneratePhotoPointCloud = jest.fn();
const mockIsUvDev2 = jest.fn();

jest.mock('@core/app/svgedit/stl/photoPointCloud', () => ({
  applyPhotoPointCloud: (...args: unknown[]) => mockApplyPhotoPointCloud(...args),
}));
jest.mock('@core/app/svgedit/stl/photoPointCloudGenerator', () => ({
  generatePhotoPointCloud: (...args: unknown[]) => mockGeneratePhotoPointCloud(...args),
}));
jest.mock('@core/helpers/is-dev', () => ({ isUvDev2: () => mockIsUvDev2() }));
jest.mock('@core/helpers/useI18n', () => () => ({
  inner_engraving_settings: { generate_test_point_cloud: 'Generate Test Point Cloud' },
}));

import ThreeDOptions from './ThreeDOptions';

const makeElem = (tag: 'image' | 'rect') => document.createElementNS('http://www.w3.org/2000/svg', tag);

describe('ThreeDOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsUvDev2.mockReturnValue(true);
  });

  test('has nothing for a mesh: its engraving parameters live on the layer', () => {
    const elem = makeElem('rect');

    elem.setAttribute('data-stl', '1');

    const { container } = render(<ThreeDOptions elem={elem} />);

    expect(container).toBeEmptyDOMElement();
  });

  test('hides the photo point cloud tool outside uvDev', () => {
    const elem = makeElem('image');

    elem.setAttribute('data-stl-photo', '1');
    mockIsUvDev2.mockReturnValue(false);

    const { container } = render(<ThreeDOptions elem={elem} />);

    expect(container).toBeEmptyDOMElement();
  });

  test('generates a test point cloud from a photo with its layer parameters', async () => {
    const elem = makeElem('image');
    const buffer = new ArrayBuffer(16);

    elem.id = 'photo';
    elem.setAttribute('data-stl-photo', '1');
    mockGeneratePhotoPointCloud.mockResolvedValue(buffer);

    const { getByRole } = render(<ThreeDOptions elem={elem} />);

    fireEvent.click(getByRole('button', { name: 'Generate Test Point Cloud' }));

    await waitFor(() => expect(mockApplyPhotoPointCloud).toHaveBeenCalledWith('photo', buffer));
    // the generator reads the parameters off the photo's layer itself
    expect(mockGeneratePhotoPointCloud).toHaveBeenCalledWith(elem);
  });
});
