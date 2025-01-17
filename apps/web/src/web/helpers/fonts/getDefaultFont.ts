import storage from 'implementations/storage';
import { IFont } from 'interfaces/IFont';

export default function getDefaultFont(): TextAttribute {
  const { family, postscriptName }: IFont = storage.get('default-font');

  return {
    font_family: family,
    font_postscriptName: postscriptName,
    font_size: 14,
    fill: '#000000',
    fill_opacity: 0,
    text_anchor: 'start',
  };
}
