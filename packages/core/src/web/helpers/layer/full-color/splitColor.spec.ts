jest.mock('@core/helpers/api/utils-ws', () => jest.fn());

// Import AFTER mocks.
import { foldBlackIntoCmy } from './splitColor';

// one pixel per channel, [value, value, value, alpha], 255 means no ink
const channel = (value: number, alpha: number) => new Uint8ClampedArray([value, value, value, alpha]);

describe('foldBlackIntoCmy', () => {
  it('moves black ink into channels that had none', () => {
    const channels = [channel(55, 255), channel(255, 0), channel(255, 0), channel(255, 0)];
    const empty = [false, true, true, true];

    foldBlackIntoCmy(channels, empty);

    // 200 of black ink (255 - 55) lands on each of cyan, magenta and yellow
    channels.slice(1).forEach((data) => expect([...data]).toEqual([55, 55, 55, 255]));
    expect(empty).toEqual([true, false, false, false]);
  });

  it('adds to the ink already there and clamps at full ink', () => {
    const channels = [channel(55, 255), channel(200, 255), channel(0, 255), channel(255, 0)];
    const empty = [false, false, false, true];

    foldBlackIntoCmy(channels, empty);

    expect([...channels[1]]).toEqual([0, 0, 0, 255]); // 55 of ink + 200 clamps to full
    expect([...channels[2]]).toEqual([0, 0, 0, 255]); // already full
    expect([...channels[3]]).toEqual([55, 55, 55, 255]);
  });

  it('leaves the other channels alone when there is no black ink', () => {
    const channels = [channel(255, 0), channel(120, 255), channel(255, 0), channel(255, 0)];
    const empty = [true, false, true, true];

    foldBlackIntoCmy(channels, empty);

    expect([...channels[1]]).toEqual([120, 120, 120, 255]);
    expect(empty).toEqual([true, false, true, true]);
  });
});
