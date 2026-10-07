import { getBundledFont } from './bundledFonts';

jest.mock('@core/helpers/is-web', () => () => true);

describe('bundledFonts', () => {
  it('resolves the bundled Montserrat Medium by postscript name only', () => {
    const font = getBundledFont('Montserrat-Medium');

    expect(font).toMatchObject({ family: 'Montserrat', postscriptName: 'Montserrat-Medium', style: 'Medium' });
    expect('url' in font!).toBe(true);
    expect(getBundledFont('Montserrat-Regular')).toBeUndefined();
  });
});
