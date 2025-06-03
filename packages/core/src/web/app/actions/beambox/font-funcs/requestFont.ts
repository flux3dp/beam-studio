import fontHelper from '@core/helpers/fonts/fontHelper';
import type { GeneralFont, IFontQuery } from '@core/interfaces/IFont';

import { memoize } from './utils';

export const requestManyFontsByFamily = memoize((family: string) => Array.from(fontHelper.findFonts({ family })));
export const requestOneFontByFamilyAndStyle = ({ family, italic, style, weight }: IFontQuery): GeneralFont =>
  fontHelper.findFont({ family, italic, style, weight });
