import fontConstants from '@core/app/constants/font-constants';
import { getStorage, setStorage } from '@core/app/stores/storageStore';
import type { IDefaultFont } from '@core/interfaces/IFont';

import fontHelper from '../fonts/fontHelper';
import { getOS } from '../getOS';
import isWeb from '../is-web';

const initializeDefaultFont = (): void => {
  if (getStorage('default-font')) return;

  const lang = navigator.language;
  const web = isWeb();
  const os = getOS();
  let defaultFontFamily = 'Arial';

  if (web) {
    defaultFontFamily = 'Noto Sans';
  } else if (os === 'Linux') {
    defaultFontFamily = 'Ubuntu';
  }

  if (fontConstants[lang]) {
    if (web && fontConstants[lang].web) {
      defaultFontFamily = fontConstants[lang].web;
    } else if (fontConstants[lang][os]) {
      defaultFontFamily = fontConstants[lang][os];
    }
  }

  const fonts = fontHelper.findFonts({ family: defaultFontFamily });
  let defaultFont: IDefaultFont;

  if (fonts.length > 0) {
    defaultFont = fonts.filter((font) => font.style === 'Regular')[0] || fonts[0];
  } else {
    defaultFont = fontHelper.getAvailableFonts()[0];
  }

  setStorage('default-font', {
    family: defaultFont.family,
    postscriptName: defaultFont.postscriptName,
    style: defaultFont.style,
  });
};

export default initializeDefaultFont;
