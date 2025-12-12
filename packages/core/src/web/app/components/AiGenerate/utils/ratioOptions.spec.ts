import { ADDITIONAL_RATIOS, ALWAYS_DISPLAYED_RATIOS } from './ratioOptions';

describe('ratioOptions', () => {
  describe('ALWAYS_DISPLAYED_RATIOS', () => {
    it('should have 3 items', () => {
      expect(ALWAYS_DISPLAYED_RATIOS).toHaveLength(3);
    });

    it('should have correct always displayed ratios', () => {
      expect(ALWAYS_DISPLAYED_RATIOS[0]).toEqual({ aspectRatio: '1:1', displayLabel: '1:1' });
      expect(ALWAYS_DISPLAYED_RATIOS[1]).toEqual({ aspectRatio: '4:3', displayLabel: '4:3' });
      expect(ALWAYS_DISPLAYED_RATIOS[2]).toEqual({ aspectRatio: '16:9', displayLabel: '16:9' });
    });
  });

  describe('ADDITIONAL_RATIOS', () => {
    it('should have 5 items', () => {
      expect(ADDITIONAL_RATIOS).toHaveLength(5);
    });

    it('should have correct additional ratios', () => {
      expect(ADDITIONAL_RATIOS[0]).toEqual({ aspectRatio: '3:2', displayLabel: '3:2' });
      expect(ADDITIONAL_RATIOS[1]).toEqual({ aspectRatio: '2:3', displayLabel: '2:3' });
      expect(ADDITIONAL_RATIOS[2]).toEqual({ aspectRatio: '3:4', displayLabel: '3:4' });
      expect(ADDITIONAL_RATIOS[3]).toEqual({ aspectRatio: '9:16', displayLabel: '9:16' });
      expect(ADDITIONAL_RATIOS[4]).toEqual({ aspectRatio: '21:9', displayLabel: '21:9' });
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
