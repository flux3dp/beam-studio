import { getBundledFamilies, getBundledFontsOfFamily } from './bundledFonts';

jest.mock('@core/helpers/is-web', () => () => true);

describe('bundledFonts', () => {
  it('lists the bundled Montserrat Medium under its family', () => {
    const faces = getBundledFontsOfFamily('Montserrat');

    expect(faces.map((f) => [f.postscriptName, f.style])).toEqual([['Montserrat-Medium', 'Medium']]);
    expect(getBundledFontsOfFamily('Nope')).toEqual([]);
    expect(getBundledFamilies()).toEqual(['Montserrat']);
  });
});
