import { getSizePixels, getWidthHeight } from './dimensions';

describe('dimensions utils', () => {
  describe('getWidthHeight', () => {
    it('should return square dimensions for 1:1 ratio', () => {
      expect(getWidthHeight('1:1', '1K')).toEqual({ height: 1024, width: 1024 });
      expect(getWidthHeight('1:1', '2K')).toEqual({ height: 2048, width: 2048 });
      expect(getWidthHeight('1:1', '4K')).toEqual({ height: 4096, width: 4096 });
    });

    it('should return landscape dimensions for 16:9 ratio (width > height)', () => {
      expect(getWidthHeight('16:9', '1K')).toEqual({ height: 576, width: 1024 });
      expect(getWidthHeight('16:9', '2K')).toEqual({ height: 1152, width: 2048 });
    });

    it('should return portrait dimensions for 9:16 ratio (height > width)', () => {
      expect(getWidthHeight('9:16', '1K')).toEqual({ height: 1024, width: 576 });
    });

    it('should return landscape dimensions for 4:3 ratio', () => {
      expect(getWidthHeight('4:3', '1K')).toEqual({ height: 768, width: 1024 });
    });

    it('should return portrait dimensions for 3:4 ratio', () => {
      expect(getWidthHeight('3:4', '1K')).toEqual({ height: 1024, width: 768 });
    });

    it('should return landscape dimensions for 3:2 ratio', () => {
      expect(getWidthHeight('3:2', '1K')).toEqual({ height: 683, width: 1024 });
    });

    it('should return portrait dimensions for 2:3 ratio', () => {
      expect(getWidthHeight('2:3', '1K')).toEqual({ height: 1024, width: 683 });
    });

    it('should return correct dimensions for 21:9 ultra-wide ratio', () => {
      expect(getWidthHeight('21:9', '1K')).toEqual({ height: 439, width: 1024 });
    });
  });

  describe('getSizePixels', () => {
    it('should return formatted pixel dimensions for 1:1 ratio', () => {
      expect(getSizePixels({ aspectRatio: '1:1', size: '1K' })).toBe('1024 x 1024');
      expect(getSizePixels({ aspectRatio: '1:1', size: '2K' })).toBe('2048 x 2048');
      expect(getSizePixels({ aspectRatio: '1:1', size: '4K' })).toBe('4096 x 4096');
    });

    it('should return formatted dimensions for landscape 16:9 ratio', () => {
      expect(getSizePixels({ aspectRatio: '16:9', size: '1K' })).toBe('1024 x 576');
      expect(getSizePixels({ aspectRatio: '16:9', size: '2K' })).toBe('2048 x 1152');
    });

    it('should return formatted dimensions for portrait 9:16 ratio', () => {
      expect(getSizePixels({ aspectRatio: '9:16', size: '1K' })).toBe('576 x 1024');
    });

    it('should return formatted dimensions for 4:3 ratio', () => {
      expect(getSizePixels({ aspectRatio: '4:3', size: '1K' })).toBe('1024 x 768');
    });

    it('should return formatted dimensions for 3:4 portrait ratio', () => {
      expect(getSizePixels({ aspectRatio: '3:4', size: '1K' })).toBe('768 x 1024');
    });
  });
});
