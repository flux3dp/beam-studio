import { getSizeFromResolution, getSizePixels, getSizeResolution, getWidthHeight } from './dimensions';

describe('dimensions utils', () => {
  describe('getWidthHeight', () => {
    it('should return square dimensions for 1:1 ratio', () => {
      expect(getWidthHeight('1:1', 'small')).toEqual({ height: 1024, width: 1024 });
      expect(getWidthHeight('1:1', 'medium')).toEqual({ height: 2048, width: 2048 });
      expect(getWidthHeight('1:1', 'large')).toEqual({ height: 4096, width: 4096 });
    });

    it('should return landscape dimensions for 16:9 ratio (width > height)', () => {
      expect(getWidthHeight('16:9', 'small')).toEqual({ height: 576, width: 1024 });
      expect(getWidthHeight('16:9', 'medium')).toEqual({ height: 1152, width: 2048 });
    });

    it('should return portrait dimensions for 9:16 ratio (height > width)', () => {
      expect(getWidthHeight('9:16', 'small')).toEqual({ height: 1024, width: 576 });
    });

    it('should return landscape dimensions for 4:3 ratio', () => {
      expect(getWidthHeight('4:3', 'small')).toEqual({ height: 768, width: 1024 });
    });

    it('should return portrait dimensions for 3:4 ratio', () => {
      expect(getWidthHeight('3:4', 'small')).toEqual({ height: 1024, width: 768 });
    });

    it('should return landscape dimensions for 3:2 ratio', () => {
      expect(getWidthHeight('3:2', 'small')).toEqual({ height: 683, width: 1024 });
    });

    it('should return portrait dimensions for 2:3 ratio', () => {
      expect(getWidthHeight('2:3', 'small')).toEqual({ height: 1024, width: 683 });
    });

    it('should return correct dimensions for 21:9 ultra-wide ratio', () => {
      expect(getWidthHeight('21:9', 'small')).toEqual({ height: 439, width: 1024 });
    });
  });

  describe('getSizePixels', () => {
    it('should return formatted pixel dimensions for 1:1 ratio', () => {
      expect(getSizePixels({ aspectRatio: '1:1', size: 'small' })).toBe('1024 x 1024');
      expect(getSizePixels({ aspectRatio: '1:1', size: 'medium' })).toBe('2048 x 2048');
      expect(getSizePixels({ aspectRatio: '1:1', size: 'large' })).toBe('4096 x 4096');
    });

    it('should return formatted dimensions for landscape 16:9 ratio', () => {
      expect(getSizePixels({ aspectRatio: '16:9', size: 'small' })).toBe('1024 x 576');
      expect(getSizePixels({ aspectRatio: '16:9', size: 'medium' })).toBe('2048 x 1152');
    });

    it('should return formatted dimensions for portrait 9:16 ratio', () => {
      expect(getSizePixels({ aspectRatio: '9:16', size: 'small' })).toBe('576 x 1024');
    });

    it('should return formatted dimensions for 4:3 ratio', () => {
      expect(getSizePixels({ aspectRatio: '4:3', size: 'small' })).toBe('1024 x 768');
    });

    it('should return formatted dimensions for 3:4 portrait ratio', () => {
      expect(getSizePixels({ aspectRatio: '3:4', size: 'small' })).toBe('768 x 1024');
    });
  });

  describe('getSizeResolution', () => {
    it('should return 1K for small size', () => {
      expect(getSizeResolution('small')).toBe('1K');
    });

    it('should return 2K for medium size', () => {
      expect(getSizeResolution('medium')).toBe('2K');
    });

    it('should return 4K for large size', () => {
      expect(getSizeResolution('large')).toBe('4K');
    });
  });

  describe('getSizeFromResolution', () => {
    it('should return large for 4K', () => {
      expect(getSizeFromResolution('4K')).toBe('large');
    });

    it('should return medium for 2K', () => {
      expect(getSizeFromResolution('2K')).toBe('medium');
    });

    it('should return small for 1K', () => {
      expect(getSizeFromResolution('1K')).toBe('small');
    });

    it('should default to small for unknown resolution', () => {
      expect(getSizeFromResolution('8K')).toBe('small');
    });
  });
});
