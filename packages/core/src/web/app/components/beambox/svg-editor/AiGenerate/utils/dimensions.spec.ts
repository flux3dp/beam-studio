import {
  getAspectRatioFromImageSize,
  getImageResolution,
  getImageSizeOption,
  getOrientationFromImageSize,
  getSizeFromImageResolution,
  getSizePixels,
} from './dimensions';

describe('dimensions utils', () => {
  describe('getSizePixels', () => {
    it('should return square dimensions for 1:1 ratio', () => {
      expect(getSizePixels({ aspectRatio: '1:1', orientation: 'landscape', size: 'small' })).toBe('1024 x 1024');
      expect(getSizePixels({ aspectRatio: '1:1', orientation: 'landscape', size: 'medium' })).toBe('2048 x 2048');
      expect(getSizePixels({ aspectRatio: '1:1', orientation: 'landscape', size: 'large' })).toBe('4096 x 4096');
    });

    it('should return landscape dimensions for 16:9 ratio', () => {
      expect(getSizePixels({ aspectRatio: '16:9', orientation: 'landscape', size: 'small' })).toBe('1024 x 576');
      expect(getSizePixels({ aspectRatio: '16:9', orientation: 'landscape', size: 'medium' })).toBe('2048 x 1152');
    });

    it('should return portrait dimensions for 16:9 ratio', () => {
      expect(getSizePixels({ aspectRatio: '16:9', orientation: 'portrait', size: 'small' })).toBe('576 x 1024');
    });

    it('should return landscape dimensions for 4:3 ratio', () => {
      expect(getSizePixels({ aspectRatio: '4:3', orientation: 'landscape', size: 'small' })).toBe('1024 x 768');
    });

    it('should return portrait dimensions for 4:3 ratio', () => {
      expect(getSizePixels({ aspectRatio: '4:3', orientation: 'portrait', size: 'small' })).toBe('768 x 1024');
    });

    it('should return landscape dimensions for 3:2 ratio', () => {
      expect(getSizePixels({ aspectRatio: '3:2', orientation: 'landscape', size: 'small' })).toBe('1024 x 683');
    });

    it('should return portrait dimensions for 3:2 ratio', () => {
      expect(getSizePixels({ aspectRatio: '3:2', orientation: 'portrait', size: 'small' })).toBe('683 x 1024');
    });
  });

  describe('getImageSizeOption', () => {
    it('should return square_hd for 1:1 ratio', () => {
      expect(getImageSizeOption({ aspectRatio: '1:1', orientation: 'landscape', size: 'small' })).toBe('square_hd');
    });

    it('should return landscape_16_9 for 16:9 landscape', () => {
      expect(getImageSizeOption({ aspectRatio: '16:9', orientation: 'landscape', size: 'small' })).toBe(
        'landscape_16_9',
      );
    });

    it('should return portrait_16_9 for 16:9 portrait', () => {
      expect(getImageSizeOption({ aspectRatio: '16:9', orientation: 'portrait', size: 'small' })).toBe('portrait_16_9');
    });

    it('should return landscape_4_3 for 4:3 landscape', () => {
      expect(getImageSizeOption({ aspectRatio: '4:3', orientation: 'landscape', size: 'small' })).toBe('landscape_4_3');
    });

    it('should return portrait_4_3 for 4:3 portrait', () => {
      expect(getImageSizeOption({ aspectRatio: '4:3', orientation: 'portrait', size: 'small' })).toBe('portrait_4_3');
    });

    it('should return landscape_3_2 for 3:2 landscape', () => {
      expect(getImageSizeOption({ aspectRatio: '3:2', orientation: 'landscape', size: 'small' })).toBe('landscape_3_2');
    });

    it('should return portrait_3_2 for 3:2 portrait', () => {
      expect(getImageSizeOption({ aspectRatio: '3:2', orientation: 'portrait', size: 'small' })).toBe('portrait_3_2');
    });
  });

  describe('getImageResolution', () => {
    it('should return 1K for small size', () => {
      expect(getImageResolution({ aspectRatio: '1:1', orientation: 'landscape', size: 'small' })).toBe('1K');
    });

    it('should return 2K for medium size', () => {
      expect(getImageResolution({ aspectRatio: '1:1', orientation: 'landscape', size: 'medium' })).toBe('2K');
    });

    it('should return 4K for large size', () => {
      expect(getImageResolution({ aspectRatio: '1:1', orientation: 'landscape', size: 'large' })).toBe('4K');
    });
  });

  describe('getAspectRatioFromImageSize', () => {
    it('should extract 16:9 from image size', () => {
      expect(getAspectRatioFromImageSize('landscape_16_9')).toBe('16:9');
      expect(getAspectRatioFromImageSize('portrait_16_9')).toBe('16:9');
    });

    it('should extract 4:3 from image size', () => {
      expect(getAspectRatioFromImageSize('landscape_4_3')).toBe('4:3');
      expect(getAspectRatioFromImageSize('portrait_4_3')).toBe('4:3');
    });

    it('should extract 3:2 from image size', () => {
      expect(getAspectRatioFromImageSize('landscape_3_2')).toBe('3:2');
      expect(getAspectRatioFromImageSize('portrait_3_2')).toBe('3:2');
    });

    it('should default to 1:1 for square_hd', () => {
      expect(getAspectRatioFromImageSize('square_hd')).toBe('1:1');
    });

    it('should default to 1:1 for unknown size', () => {
      expect(getAspectRatioFromImageSize('unknown_size')).toBe('1:1');
    });
  });

  describe('getOrientationFromImageSize', () => {
    it('should return portrait for portrait_ prefix', () => {
      expect(getOrientationFromImageSize('portrait_16_9')).toBe('portrait');
      expect(getOrientationFromImageSize('portrait_4_3')).toBe('portrait');
    });

    it('should return landscape for landscape_ prefix', () => {
      expect(getOrientationFromImageSize('landscape_16_9')).toBe('landscape');
      expect(getOrientationFromImageSize('landscape_4_3')).toBe('landscape');
    });

    it('should default to landscape for square_hd', () => {
      expect(getOrientationFromImageSize('square_hd')).toBe('landscape');
    });

    it('should default to landscape for unknown size', () => {
      expect(getOrientationFromImageSize('unknown_size')).toBe('landscape');
    });
  });

  describe('getSizeFromImageResolution', () => {
    it('should return large for 4K', () => {
      expect(getSizeFromImageResolution('4K')).toBe('large');
    });

    it('should return medium for 2K', () => {
      expect(getSizeFromImageResolution('2K')).toBe('medium');
    });

    it('should return small for 1K', () => {
      expect(getSizeFromImageResolution('1K')).toBe('small');
    });

    it('should default to small for unknown resolution', () => {
      expect(getSizeFromImageResolution('8K')).toBe('small');
    });
  });
});
