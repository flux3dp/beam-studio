import storage from '@core/implementations/storage';
import type { IDefaultFont } from '@core/interfaces/IFont';
import type { TextAttribute } from '@core/interfaces/Text';

export default function getDefaultFont(): TextAttribute {
  const { family, postscriptName }: IDefaultFont = storage.get('default-font');

  return {
    fill: '#000000',
    fill_opacity: 0,
    font_family: family,
    font_postscriptName: postscriptName,
    font_size: 14,
    stroke_width: 1,
    text_anchor: 'start',
  };
}
