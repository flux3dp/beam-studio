import colorConstants from 'app/constants/color-constants';

class RandomColorHelper {
  private currentIdx = 0;

  constructor() {
    this.currentIdx = 0;
  }

  public reset() {
    this.currentIdx = 0;
  }

  public getNextColor() {
    const color = colorConstants.randomLayerColors[this.currentIdx];
    this.currentIdx =
      this.currentIdx < colorConstants.randomLayerColors.length - 1 ? this.currentIdx + 1 : 0;
    return color;
  }
}

const randomColorHelper = new RandomColorHelper();

export default {
  getColor: (): string => randomColorHelper.getNextColor(),
  reset: (): void => randomColorHelper.reset(),
};
