import alertCaller from '@core/app/actions/alert-caller';
import { showFluxPlusWarning } from '@core/app/actions/dialog-controller';
import { axiosFluxId, FLUXID_HOST } from '@core/helpers/api/flux-id';
import type { IFont, WebFont } from '@core/interfaces/IFont';
import type { IUser } from '@core/interfaces/IUser';

const getUrlWithToken = async (postscriptName: string): Promise<null | string> => {
  const { data } = await axiosFluxId.get('oauth/?response_type=token&scope=4', {
    withCredentials: true,
  });
  const { token } = data;

  if (!token) {
    return null;
  }

  return `${FLUXID_HOST}/api/beam-studio/monotype/${postscriptName}/download/${token}`;
};

const applyStyle = async (
  font: IFont | WebFont,
  user: IUser | null,
  silent?: boolean,
): Promise<{
  fontLoadedPromise?: Promise<void>;
  success: boolean;
}> => {
  if ('hasLoaded' in font && !font.hasLoaded) {
    if (!user?.info?.subscription?.is_valid || !user?.info?.subscription?.option?.monotype) {
      if (!silent) {
        showFluxPlusWarning(true);
      }

      return { success: false };
    }

    const url = await getUrlWithToken(font.postscriptName);

    if (!url) {
      if (!silent) {
        showFluxPlusWarning(true);
      }

      return { success: false };
    }

    const myFont = new FontFace(font.family, `url(${url})`, {
      display: 'swap',
      style: font.italic ? 'italic' : 'normal',
      weight: font.weight.toString(),
    });

    return {
      fontLoadedPromise: myFont
        .load()
        .then((newFontFace) => {
          document.fonts.add(newFontFace);

          font.hasLoaded = true;
        })
        .catch(() => {
          alertCaller.popUpError({
            message: `tUnable to get font ${font.postscriptName}`,
          });
        })
        .finally(() => new Promise<void>((r) => r())),
      success: true,
    };
  }

  return { success: true };
};

const getAvailableFonts = async (
  lang?: string,
): Promise<null | {
  monotypeLangFonts: WebFont[];
  monotypePreviewSrcMap: { [family: string]: string };
}> => {
  try {
    const { data } = await axiosFluxId.get(`api/beam-studio/monotype/fonts${lang ? `?lang=${lang}` : ''}`);
    const { fonts = [] } = data;
    const monotypePreviewSrcMap: { [family: string]: string } = {};
    const monotypeLangFonts = fonts.map((font) => {
      if (font.preview_img && !monotypePreviewSrcMap[font.family]) {
        monotypePreviewSrcMap[font.family] = font.preview_img;
      }

      return {
        ...font,
        hasLoaded: false,
        postscriptName: font.postscript_name,
      };
    });

    return { monotypeLangFonts, monotypePreviewSrcMap };
  } catch {
    console.error('Failed to get monotype font list');

    return null;
  }
};

export default {
  applyStyle,
  getAvailableFonts,
  getUrlWithToken,
};
