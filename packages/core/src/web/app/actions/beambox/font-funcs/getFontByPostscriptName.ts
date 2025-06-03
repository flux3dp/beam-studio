import fontHelper from '@core/helpers/fonts/fontHelper';

import { memoize } from './utils';

export const getFontByPostscriptName = memoize((postscriptName: string) => {
  if (window.os === 'MacOS') {
    return fontHelper.findFont({ postscriptName });
  }

  const allFonts = fontHelper.getAvailableFonts();
  const fitFonts = allFonts.filter(({ postscriptName: name }) => name === postscriptName);

  console.log(fitFonts);

  return (fitFonts.length > 0 ? fitFonts : allFonts)[0];
});
