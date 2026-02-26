import { TabEvents } from '@core/app/constants/ipcEvents';
import { getStorage, useStorageStore } from '@core/app/stores/storageStore';
import isWeb from '@core/helpers/is-web';
import communicator from '@core/implementations/communicator';
import type { IDefaultFont } from '@core/interfaces/IFont';
import type { TextAttribute } from '@core/interfaces/Text';

// Note: curText is initialized when svgCanvas is ready
// Initial value is defined in svg-editor.ts defaultConfig.text
let curText = {} as unknown as TextAttribute;

export const initCurText = () => {
  const defaultFont: IDefaultFont = getStorage('default-font');

  curText = {
    fill_opacity: 0,
    font_family: defaultFont ? defaultFont.family : 'Arial',
    font_postscriptName: defaultFont ? defaultFont.postscriptName : 'ArialMT',
    font_size: isWeb() ? 200 : 100,
    stroke_width: 2,
  };
};

export const updateCurText = (newValue: Partial<TextAttribute>): void => {
  curText = { ...curText, ...newValue };
};

export const useDefaultFont = (): void => {
  const defaultFont: IDefaultFont = getStorage('default-font');

  if (defaultFont) {
    curText.font_family = defaultFont.family;
    curText.font_postscriptName = defaultFont.postscriptName;
  }
};

export const getCurText = (): TextAttribute => curText;

communicator.on(TabEvents.ReloadSettings, () => {
  useDefaultFont();
});

useStorageStore.subscribe(
  (state) => state['default-font'],
  ({ family, postscriptName }) => updateCurText({ font_family: family, font_postscriptName: postscriptName }),
);
