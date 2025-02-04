const showRatingDialog = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  showRatingDialog: (...args) => showRatingDialog(...args),
}));

const get = jest.fn();
const set = jest.fn();
const isExisting = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get: (...args) => get(...args),
  isExisting: (...args) => isExisting(...args),
  set: (...args) => set(...args),
}));

const getInfo = jest.fn();
const submitRating = jest.fn();

jest.mock('@core/helpers/api/flux-id', () => ({
  getInfo: (...args) => getInfo(...args),
  submitRating: (...args) => submitRating(...args),
}));

window['FLUX'].version = '1.0.0';

import RatingHelper from './rating-helper';

describe('test rating-helper', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('test init', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    test('rating record does not exist', () => {
      isExisting.mockReturnValue(false);
      RatingHelper.init();
      expect(set).toHaveBeenCalledTimes(1);
      expect(set).toHaveBeenNthCalledWith(1, 'rating-record', {
        isIgnored: false,
        isVoted: false,
        score: 0,
        times: 1,
        version: '1.0.0',
      });
    });

    test('the version stored in window.FLUX is not the same as that in storage', () => {
      isExisting.mockReturnValue(true);
      get.mockReturnValue({
        version: '1.0.1',
      });
      RatingHelper.init();
      expect(set).toHaveBeenCalledTimes(1);
      expect(set).toHaveBeenNthCalledWith(1, 'rating-record', {
        isIgnored: false,
        isVoted: false,
        score: 0,
        times: 1,
        version: '1.0.0',
      });
    });

    test('record is ignored', () => {
      isExisting.mockReturnValue(true);
      get.mockReturnValue({
        isIgnored: true,
        version: '1.0.0',
      });
      RatingHelper.init();
      expect(showRatingDialog).not.toHaveBeenCalled();
    });

    test('record is voted', () => {
      isExisting.mockReturnValue(true);
      get.mockReturnValue({
        isVoted: true,
        version: '1.0.0',
      });
      RatingHelper.init();
      expect(showRatingDialog).not.toHaveBeenCalled();
    });

    test('show rating dialog', () => {
      isExisting.mockReturnValue(true);
      get.mockReturnValue({
        times: 5,
        version: '1.0.0',
      });
      RatingHelper.init();
      expect(showRatingDialog).toHaveBeenCalledTimes(1);
      expect(set).toHaveBeenCalledTimes(1);
      expect(set).toHaveBeenNthCalledWith(1, 'rating-record', {
        times: 6,
        version: '1.0.0',
      });
    });

    test('does not show rating dialog because rating times is not greater than four', () => {
      isExisting.mockReturnValue(true);
      get.mockReturnValue({
        times: 4,
        version: '1.0.0',
      });
      RatingHelper.init();
      expect(showRatingDialog).not.toHaveBeenCalled();
      expect(set).toHaveBeenCalledTimes(1);
      expect(set).toHaveBeenNthCalledWith(1, 'rating-record', {
        times: 5,
        version: '1.0.0',
      });
    });

    test('does not show rating dialog because rating times % 5 is not zero', () => {
      isExisting.mockReturnValue(true);
      get.mockReturnValue({
        times: 6,
        version: '1.0.0',
      });
      RatingHelper.init();
      expect(showRatingDialog).not.toHaveBeenCalled();
      expect(set).toHaveBeenCalledTimes(1);
      expect(set).toHaveBeenNthCalledWith(1, 'rating-record', {
        times: 7,
        version: '1.0.0',
      });
    });
  });

  test('test setNotShowing', () => {
    get.mockReturnValue({
      isIgnored: false,
    });
    RatingHelper.setNotShowing();
    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenNthCalledWith(1, 'rating-record', {
      isIgnored: true,
      version: '1.0.0',
    });
  });
});
