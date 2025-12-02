import { ADDITIONAL_RATIOS, ALL_RATIOS, ALWAYS_DISPLAYED_COUNT, ALWAYS_DISPLAYED_RATIOS } from './ratioOptions';

describe('ratioOptions', () => {
  describe('ALL_RATIOS', () => {
    it('should have 8 total ratios', () => {
      expect(ALL_RATIOS).toHaveLength(8);
    });

    it('should have correct always displayed ratios', () => {
      expect(ALL_RATIOS[0]).toEqual({ aspectRatio: '1:1', displayLabel: '1:1' });
      expect(ALL_RATIOS[1]).toEqual({ aspectRatio: '4:3', displayLabel: '4:3' });
      expect(ALL_RATIOS[2]).toEqual({ aspectRatio: '16:9', displayLabel: '16:9' });
    });

    it('should have correct additional ratios', () => {
      expect(ALL_RATIOS[3]).toEqual({ aspectRatio: '3:2', displayLabel: '3:2' });
      expect(ALL_RATIOS[4]).toEqual({ aspectRatio: '2:3', displayLabel: '2:3' });
      expect(ALL_RATIOS[5]).toEqual({ aspectRatio: '3:4', displayLabel: '3:4' });
      expect(ALL_RATIOS[6]).toEqual({ aspectRatio: '9:16', displayLabel: '9:16' });
      expect(ALL_RATIOS[7]).toEqual({ aspectRatio: '21:9', displayLabel: '21:9' });
    });
  });

  describe('ALWAYS_DISPLAYED_COUNT', () => {
    it('should be 3', () => {
      expect(ALWAYS_DISPLAYED_COUNT).toBe(3);
    });
  });

  describe('ALWAYS_DISPLAYED_RATIOS', () => {
    it('should have 3 items', () => {
      expect(ALWAYS_DISPLAYED_RATIOS).toHaveLength(3);
    });

    it('should be first 3 items from ALL_RATIOS', () => {
      expect(ALWAYS_DISPLAYED_RATIOS).toEqual(ALL_RATIOS.slice(0, 3));
    });
  });

  describe('ADDITIONAL_RATIOS', () => {
    it('should have 5 items', () => {
      expect(ADDITIONAL_RATIOS).toHaveLength(5);
    });

    it('should be last 5 items from ALL_RATIOS', () => {
      expect(ADDITIONAL_RATIOS).toEqual(ALL_RATIOS.slice(3));
    });

    it('should contain portrait ratios (aspect ratio with height > width)', () => {
      // Portrait ratios are those where the first number is smaller than the second
      const portraitRatios = ADDITIONAL_RATIOS.filter((r) => {
        const [w, h] = r.aspectRatio.split(':').map(Number);

        return w < h;
      });

      expect(portraitRatios).toHaveLength(3); // 2:3, 3:4, 9:16
    });
  });
});
