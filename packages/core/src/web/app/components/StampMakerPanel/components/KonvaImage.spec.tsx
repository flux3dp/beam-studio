import React from 'react';
import { render } from '@testing-library/react';

const mockKonvaFilters = {
  Blur: jest.fn(),
  Brighten: jest.fn(),
  Invert: jest.fn(),
};

jest.mock('konva', () => ({
  Filters: mockKonvaFilters,
}));

const mockUseImage = jest.fn();
const mockCache = jest.fn();
const mockScaleX = jest.fn();
const mockOffsetX = jest.fn();
const mockIsCached = jest.fn();
const mockGetCachedSceneCanvas = jest.fn();

jest.mock('use-image', () => mockUseImage);

jest.mock('react-konva', () => ({
  Image: React.forwardRef(({ fill, filters, image }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      _getCachedSceneCanvas: mockGetCachedSceneCanvas,
      cache: mockCache,
      isCached: mockIsCached,
      offsetX: mockOffsetX,
      scaleX: mockScaleX,
    }));

    return (
      <div data-testid="konva-image">
        <span>Filters: {filters?.length || 0}</span>
        <span>Image: {image ? 'loaded' : 'not loaded'}</span>
        <span>Fill: {fill}</span>
      </div>
    );
  }),
}));

import type { KonvaImageRef } from './KonvaImage';
import KonvaImage from './KonvaImage';

describe('test KonvaImage', () => {
  const mockImage = {
    height: 100,
    width: 100,
  } as HTMLImageElement;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseImage.mockReturnValue([mockImage, 'loaded']);
    mockIsCached.mockReturnValue(true);
  });

  it('should render correctly', () => {
    const { container } = render(<KonvaImage src="test.png" />);

    expect(container).toMatchSnapshot();
  });

  it('should load image with useImage hook', () => {
    render(<KonvaImage src="test.png" />);

    expect(mockUseImage).toHaveBeenCalledWith('test.png', 'anonymous');
  });

  it('should render with filters prop', () => {
    const filters = [mockKonvaFilters.Blur, mockKonvaFilters.Brighten];
    const { getByText } = render(<KonvaImage filters={filters} src="test.png" />);

    expect(getByText('Filters: 2')).toBeInTheDocument();
  });

  it('should apply horizontal flip when horizontalFlip is true', () => {
    render(<KonvaImage horizontalFlip={true} src="test.png" />);

    expect(mockScaleX).toHaveBeenCalledWith(-1);
    expect(mockOffsetX).toHaveBeenCalledWith(100);
    expect(mockCache).toHaveBeenCalledWith({ pixelRatio: 1 });
  });

  it('should not apply horizontal flip when horizontalFlip is false', () => {
    render(<KonvaImage horizontalFlip={false} src="test.png" />);

    expect(mockScaleX).toHaveBeenCalledWith(1);
    expect(mockOffsetX).toHaveBeenCalledWith(0);
    expect(mockCache).toHaveBeenCalledWith({ pixelRatio: 1 });
  });

  it('should use default horizontalFlip value of false', () => {
    render(<KonvaImage src="test.png" />);

    expect(mockScaleX).toHaveBeenCalledWith(1);
    expect(mockOffsetX).toHaveBeenCalledWith(0);
  });

  it('should expose ref methods correctly', () => {
    const ref = React.createRef<KonvaImageRef>();

    render(<KonvaImage ref={ref} src="test.png" />);

    expect(ref.current).toBeDefined();
    expect(ref.current?.isCached).toBe(mockIsCached);
    expect(ref.current?._getCachedSceneCanvas).toBe(mockGetCachedSceneCanvas);
    expect(ref.current?.useImageStatus).toBe('loaded');
  });

  it('should update when image loading status changes', () => {
    mockUseImage.mockReturnValue([null, 'loading']);

    const { getByText, rerender } = render(<KonvaImage src="test.png" />);

    expect(getByText('Image: not loaded')).toBeInTheDocument();

    mockUseImage.mockReturnValue([mockImage, 'loaded']);
    rerender(<KonvaImage src="test.png" />);

    expect(getByText('Image: loaded')).toBeInTheDocument();
  });

  it('should not cache when image is not loaded', () => {
    mockUseImage.mockReturnValue([null, 'loading']);
    render(<KonvaImage src="test.png" />);

    expect(mockCache).not.toHaveBeenCalled();
  });

  it('should re-cache when horizontalFlip changes', () => {
    const { rerender } = render(<KonvaImage horizontalFlip={false} src="test.png" />);

    expect(mockCache).toHaveBeenCalledTimes(1);

    rerender(<KonvaImage horizontalFlip={true} src="test.png" />);

    expect(mockCache).toHaveBeenCalledTimes(2);
    expect(mockScaleX).toHaveBeenLastCalledWith(-1);
    expect(mockOffsetX).toHaveBeenLastCalledWith(100);
  });

  it('should handle image loading failure', () => {
    mockUseImage.mockReturnValue([null, 'failed']);

    const ref = React.createRef<KonvaImageRef>();

    render(<KonvaImage ref={ref} src="test.png" />);

    expect(ref.current?.useImageStatus).toBe('failed');
    expect(mockCache).not.toHaveBeenCalled();
  });

  it('should set fill to white', () => {
    const { getByText } = render(<KonvaImage src="test.png" />);

    expect(getByText('Fill: white')).toBeInTheDocument();
  });
});
