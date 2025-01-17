import alertCaller from 'app/actions/alert-caller';
import { axiosFluxId, FLUXID_HOST } from 'helpers/api/flux-id';
import { IFont, WebFont } from 'interfaces/IFont';
import { IUser } from 'interfaces/IUser';
import { showFluxPlusWarning } from 'app/actions/dialog-controller';

const getUrlWithToken = async (postscriptName: string): Promise<string | null> => {
  const { data } = await axiosFluxId.get('oauth/?response_type=token&scope=4', {
    withCredentials: true,
  });
  const { token } = data;
  if (!token) return null;
  return `${FLUXID_HOST}/api/beam-studio/monotype/${postscriptName}/download/${token}`;
};

const applyStyle = async (
  font: WebFont | IFont,
  user: IUser | null,
  silent?: boolean
): Promise<{
  success: boolean;
  fontLoadedPromise?: Promise<void>;
}> => {
  if ('hasLoaded' in font && !font.hasLoaded) {
    if (!user?.info?.subscription?.is_valid || !user?.info?.subscription?.option?.monotype) {
      if (!silent) showFluxPlusWarning(true);
      return { success: false };
    }
    const url = await getUrlWithToken(font.postscriptName);
    if (!url) {
      if (!silent) showFluxPlusWarning(true);
      return { success: false };
    }
    const myFont = new FontFace(font.family, `url(${url})`, {
      style: font.italic ? 'italic' : 'normal',
      weight: font.weight.toString(),
      display: 'swap',
    });

    return {
      success: true,
      fontLoadedPromise: myFont
        .load()
        .then((newFontFace) => {
          document.fonts.add(newFontFace);
          // eslint-disable-next-line no-param-reassign
          font.hasLoaded = true;
        })
        .catch(() => {
          alertCaller.popUpError({
            message: `tUnable to get font ${font.postscriptName}`,
          });
        })
        .finally(() => new Promise<void>((r) => r())),
    };
  }
  return { success: true };
};

const getAvailableFonts = async (
  lang?: string
): Promise<{
  monotypeLangFonts: WebFont[];
  monotypePreviewSrcMap: { [family: string]: string };
} | null> => {
  try {
    const { data } = await axiosFluxId.get(
      `api/beam-studio/monotype/fonts${lang ? `?lang=${lang}` : ''}`
    );
    const { fonts = [] } = data;
    const monotypePreviewSrcMap: { [family: string]: string } = {};
    const monotypeLangFonts = fonts.map((font) => {
      if (font.preview_img && !monotypePreviewSrcMap[font.family]) {
        monotypePreviewSrcMap[font.family] = font.preview_img;
      }
      return {
        ...font,
        postscriptName: font.postscript_name,
        hasLoaded: false,
      };
    });
    return { monotypeLangFonts, monotypePreviewSrcMap };
  } catch {
    console.error('Failed to get monotype font list');
    return null;
  }
};

export default {
  getAvailableFonts,
  applyStyle,
  getUrlWithToken,
};
