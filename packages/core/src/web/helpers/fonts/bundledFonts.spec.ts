import { getBundledFont } from './bundledFonts';

const mockIsWeb = jest.fn(() => true);

jest.mock('@core/helpers/is-web', () => () => mockIsWeb());

describe('bundledFonts', () => {
  it('resolves the bundled Montserrat Medium by postscript name only', () => {
    const font = getBundledFont('Montserrat-Medium');

    expect(font).toMatchObject({ family: 'Montserrat', postscriptName: 'Montserrat-Medium', style: 'Medium' });
    expect('url' in font!).toBe(true);
    expect(getBundledFont('Montserrat-Regular')).toBeUndefined();
  });

  it.each([
    [
      'file:///Applications/Beam%20Studio.app/Contents/index.html',
      '/Applications/Beam Studio.app/Contents/assets/fonts/Montserrat-Medium.ttf',
    ],
    [
      'file:///C:/Program%20Files/Beam%20Studio/index.html',
      'C:/Program Files/Beam Studio/assets/fonts/Montserrat-Medium.ttf',
    ],
    ['file://server/share/Beam%20Studio/index.html', '//server/share/Beam Studio/assets/fonts/Montserrat-Medium.ttf'],
  ])('derives the Electron font path from %s', (href, expected) => {
    mockIsWeb.mockReturnValueOnce(false);
    jest.spyOn(window, 'location', 'get').mockReturnValueOnce({ href } as Location);

    expect(getBundledFont('Montserrat-Medium')).toMatchObject({ path: expected });
  });
});
