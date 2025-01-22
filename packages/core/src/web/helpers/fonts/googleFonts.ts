import type { WebFont } from '@core/interfaces/IFont';

// Note:
// TextOptions Fallback font family: Noto Sans
// Web substitute candidates: Noto Sans series
// Fix above two if Noto sans series are removed
const fonts: WebFont[] = [
  // Noto Sans
  {
    family: 'Noto Sans',
    italic: false,
    postscriptName: 'NotoSans-Regular',
    queryString: 'family=Noto+Sans:ital,wght@0,400;0,700;1,400;1,700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'Noto Sans',
    italic: true,
    postscriptName: 'NotoSans-Italic',
    style: 'Italic',
    weight: 400,
  },
  {
    family: 'Noto Sans',
    italic: false,
    postscriptName: 'NotoSans-Bold',
    style: 'Bold',
    weight: 700,
  },
  {
    family: 'Noto Sans',
    italic: true,
    postscriptName: 'NotoSans-BoldItalic',
    style: 'Bold Italic',
    weight: 700,
  },
  // Noto Sans TC
  // {
  //   family: 'Noto Sans TC',
  //   italic: false,
  //   postscriptName: 'NotoSansTC-Thin',
  //   style: 'Thin',
  //   weight: 100,
  //   queryString: 'family=Noto+Sans+TC:wght@100;300;400;500;700;900',
  //   fileName: 'NotoSansTC-Thin.otf',
  // },
  // {
  //   family: 'Noto Sans TC',
  //   italic: false,
  //   postscriptName: 'NotoSansTC-Light',
  //   style: 'Light',
  //   weight: 300,
  //   fileName: 'NotoSansTC-Light.otf',
  // },
  {
    family: 'Noto Sans TC',
    fileName: 'NotoSansTC-Regular.otf',
    italic: false,
    postscriptName: 'NotoSansTC-Regular',
    queryString: 'family=Noto+Sans+TC:wght@400;700',
    style: 'Regular',
    weight: 400,
  },
  // {
  //   family: 'Noto Sans TC',
  //   italic: false,
  //   postscriptName: 'NotoSansTC-Medium',
  //   style: 'Medium',
  //   weight: 500,
  //   fileName: 'NotoSansTC-Medium.otf',
  // },
  {
    family: 'Noto Sans TC',
    fileName: 'NotoSansTC-Bold.otf',
    italic: false,
    postscriptName: 'NotoSansTC-Bold',
    style: 'Bold',
    weight: 700,
  },
  // {
  //   family: 'Noto Sans TC',
  //   italic: false,
  //   postscriptName: 'NotoSansTC-Black',
  //   style: 'Black',
  //   weight: 900,
  //   fileName: 'NotoSansTC-Black.otf',
  // },

  // Noto Sans HK
  {
    family: 'Noto Sans HK',
    fileName: 'NotoSansHK-Regular.otf',
    italic: false,
    postscriptName: 'NotoSansHK-Regular',
    queryString: 'family=Noto+Sans+HK:wght@400;700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'Noto Sans HK',
    fileName: 'NotoSansHK-Bold.otf',
    italic: false,
    postscriptName: 'NotoSansHK-Bold',
    style: 'Bold',
    weight: 700,
  },

  // Noto Sans SC
  {
    family: 'Noto Sans SC',
    fileName: 'NotoSansSC-Regular.otf',
    italic: false,
    postscriptName: 'NotoSansSC-Regular',
    queryString: 'family=Noto+Sans+SC:wght@400;700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'Noto Sans SC',
    fileName: 'NotoSansSC-Bold.otf',
    italic: false,
    postscriptName: 'NotoSansSC-Bold',
    style: 'Bold',
    weight: 700,
  },

  // Noto Sans JP
  {
    family: 'Noto Sans JP',
    fileName: 'NotoSansJP-Regular.otf',
    italic: false,
    postscriptName: 'NotoSansJP-Regular',
    queryString: 'family=Noto+Sans+JP:wght@400;700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'Noto Sans JP',
    fileName: 'NotoSansJP-Bold.otf',
    italic: false,
    postscriptName: 'NotoSansJP-Bold',
    style: 'Bold',
    weight: 700,
  },

  // Noto Sans KR
  {
    family: 'Noto Sans KR',
    fileName: 'NotoSansKR-Regular.otf',
    italic: false,
    postscriptName: 'NotoSansKR-Regular',
    queryString: 'family=Noto+Sans+KR:wght@400;700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'Noto Sans KR',
    fileName: 'NotoSansKR-Bold.otf',
    italic: false,
    postscriptName: 'NotoSansKR-Bold',
    style: 'Bold',
    weight: 700,
  },

  // Noto Serif
  {
    family: 'Noto Serif',
    italic: false,
    postscriptName: 'NotoSerif-Regular',
    queryString: 'family=Noto+Serif:ital,wght@0,400;0,700;1,400;1,700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'Noto Serif',
    italic: true,
    postscriptName: 'NotoSerif-Italic',
    style: 'Italic',
    weight: 400,
  },
  {
    family: 'Noto Serif',
    italic: false,
    postscriptName: 'NotoSerif-Bold',
    style: 'Bold',
    weight: 700,
  },
  {
    family: 'Noto Serif',
    italic: true,
    postscriptName: 'NotoSerif-BoldItalic',
    style: 'Bold Italic',
    weight: 700,
  },

  // Noto Serif TC
  {
    family: 'Noto Serif TC',
    fileName: 'NotoSerifTC-Regular.otf',
    italic: false,
    postscriptName: 'NotoSerifTC-Regular',
    queryString: 'family=Noto+Serif+TC:wght@400;700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'Noto Serif TC',
    fileName: 'NotoSerifTC-Bold.otf',
    italic: false,
    postscriptName: 'NotoSerifTC-Bold',
    style: 'Bold',
    weight: 700,
  },

  // Noto Serif SC
  {
    family: 'Noto Serif SC',
    fileName: 'NotoSerifSC-Regular.otf',
    italic: false,
    postscriptName: 'NotoSerifSC-Regular',
    queryString: 'family=Noto+Serif+SC:wght@400;700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'Noto Serif SC',
    fileName: 'NotoSerifSC-Bold.otf',
    italic: false,
    postscriptName: 'NotoSerifSC-Bold',
    style: 'Bold',
    weight: 700,
  },

  // Noto Serif JP
  {
    family: 'Noto Serif JP',
    fileName: 'NotoSerifJP-Regular.otf',
    italic: false,
    postscriptName: 'NotoSerifJP-Regular',
    queryString: 'family=Noto+Serif+JP:wght@400;700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'Noto Serif JP',
    fileName: 'NotoSerifJP-Bold.otf',
    italic: false,
    postscriptName: 'NotoSerifJP-Bold',
    style: 'Bold',
    weight: 700,
  },

  // Noto Serif KR
  {
    family: 'Noto Serif KR',
    fileName: 'NotoSerifKR-Regular.otf',
    italic: false,
    postscriptName: 'NotoSerifKR-Regular',
    queryString: 'family=Noto+Serif+KR:wght@400;700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'Noto Serif KR',
    fileName: 'NotoSerifKR-Bold.otf',
    italic: false,
    postscriptName: 'NotoSerifKR-Bold',
    style: 'Bold',
    weight: 700,
  },

  // Open Sans
  {
    family: 'Open Sans',
    italic: false,
    postscriptName: 'OpenSans-Regular',
    queryString: 'family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'Open Sans',
    italic: true,
    postscriptName: 'OpenSans-Italic',
    style: 'Italic',
    weight: 400,
  },
  {
    family: 'Open Sans',
    italic: false,
    postscriptName: 'OpenSans-Bold',
    style: 'Bold',
    weight: 700,
  },
  {
    family: 'Open Sans',
    italic: true,
    postscriptName: 'OpenSans-BoldItalic',
    style: 'Bold Italic',
    weight: 700,
  },

  // Arimo
  {
    family: 'arimo',
    italic: false,
    postscriptName: 'Arimo-Regular',
    queryString: 'family=Arimo:ital,wght@0,400;0,700;1,400;1,700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'arimo',
    italic: true,
    postscriptName: 'Arimo-Italic',
    style: 'Italic',
    weight: 400,
  },
  {
    family: 'arimo',
    italic: false,
    postscriptName: 'Arimo-Bold',
    style: 'Bold',
    weight: 700,
  },
  {
    family: 'arimo',
    italic: true,
    postscriptName: 'Arimo-BoldItalic',
    style: 'Bold Italic',
    weight: 700,
  },

  // Comic Neue
  {
    family: 'Comic Neue',
    italic: false,
    postscriptName: 'ComicNeue-Regular',
    queryString: 'family=Comic+Neue:ital,wght@0,400;0,700;1,400;1,700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'Comic Neue',
    italic: true,
    postscriptName: 'ComicNeue-Italic',
    style: 'Italic',
    weight: 400,
  },
  {
    family: 'Comic Neue',
    italic: false,
    postscriptName: 'ComicNeue-Bold',
    style: 'Bold',
    weight: 700,
  },
  {
    family: 'Comic Neue',
    italic: true,
    postscriptName: 'ComicNeue-BoldItalic',
    style: 'Bold Italic',
    weight: 700,
  },

  // Fira Sans
  {
    family: 'fira sans',
    italic: false,
    postscriptName: 'FiraSans-Regular',
    queryString: 'family=Fira+Sans:ital,wght@0,400;0,700;1,400;1,700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'fira sans',
    italic: true,
    postscriptName: 'FiraSans-Italic',
    style: 'Italic',
    weight: 400,
  },
  {
    family: 'fira sans',
    italic: false,
    postscriptName: 'FiraSans-Bold',
    style: 'Bold',
    weight: 700,
  },
  {
    family: 'fira sans',
    italic: true,
    postscriptName: 'FiraSans-BoldItalic',
    style: 'Bold Italic',
    weight: 700,
  },

  // Courier Prime
  {
    family: 'courier prime',
    italic: false,
    postscriptName: 'CourierPrime-Regular',
    queryString: 'family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'courier prime',
    italic: true,
    postscriptName: 'CourierPrime-Italic',
    style: 'Italic',
    weight: 400,
  },
  {
    family: 'courier prime',
    italic: false,
    postscriptName: 'CourierPrime-Bold',
    style: 'Bold',
    weight: 700,
  },
  {
    family: 'courier prime',
    italic: true,
    postscriptName: 'CourierPrime-BoldItalic',
    style: 'Bold Italic',
    weight: 700,
  },

  // Tinos
  {
    family: 'Tinos',
    italic: false,
    postscriptName: 'Tinos-Regular',
    queryString: 'family=Tinos:ital,wght@0,400;0,700;1,400;1,700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'Tinos',
    italic: true,
    postscriptName: 'Tinos-Italic',
    style: 'Italic',
    weight: 400,
  },
  {
    family: 'Tinos',
    italic: false,
    postscriptName: 'Tinos-Bold',
    style: 'Bold',
    weight: 700,
  },
  {
    family: 'Tinos',
    italic: true,
    postscriptName: 'Tinos-BoldItalic',
    style: 'Bold Italic',
    weight: 700,
  },

  // Oswald
  {
    family: 'Oswald',
    italic: false,
    postscriptName: 'Oswald-Regular',
    queryString: 'family=Oswald:wght@400;700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'Oswald',
    italic: false,
    postscriptName: 'Oswald-Bold',
    style: 'Bold',
    weight: 700,
  },

  // Lato
  {
    family: 'Lato',
    italic: false,
    postscriptName: 'Lato-Regular',
    queryString: 'family=Lato:ital,wght@0,400;0,700;1,400;1,700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'Lato',
    italic: true,
    postscriptName: 'Lato-Italic',
    style: 'Italic',
    weight: 400,
  },
  {
    family: 'Lato',
    italic: false,
    postscriptName: 'Lato-Bold',
    style: 'Bold',
    weight: 700,
  },
  {
    family: 'Lato',
    italic: true,
    postscriptName: 'Lato-BoldItalic',
    style: 'Bold Italic',
    weight: 700,
  },

  // Roboto
  {
    family: 'roboto',
    italic: false,
    postscriptName: 'Roboto-Regular',
    queryString: 'family=Roboto:ital,wght@0,400;0,700;1,400;1,700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'roboto',
    italic: true,
    postscriptName: 'Roboto-Italic',
    style: 'Italic',
    weight: 400,
  },
  {
    family: 'roboto',
    italic: false,
    postscriptName: 'Roboto-Bold',
    style: 'Bold',
    weight: 700,
  },
  {
    family: 'roboto',
    italic: true,
    postscriptName: 'Roboto-BoldItalic',
    style: 'Bold Italic',
    weight: 700,
  },

  // Montserrat
  {
    family: 'Montserrat',
    italic: false,
    postscriptName: 'Montserrat-Regular',
    queryString: 'family=Montserrat:ital,wght@0,400;0,700;1,400;1,700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'Montserrat',
    italic: true,
    postscriptName: 'Montserrat-Italic',
    style: 'Italic',
    weight: 400,
  },
  {
    family: 'Montserrat',
    italic: false,
    postscriptName: 'Montserrat-Bold',
    style: 'Bold',
    weight: 700,
  },
  {
    family: 'Montserrat',
    italic: true,
    postscriptName: 'Montserrat-BoldItalic',
    style: 'Bold Italic',
    weight: 700,
  },

  // Source Serif Pro
  {
    family: 'Source Serif Pro',
    italic: false,
    postscriptName: 'SourceSerifPro-Regular',
    queryString: 'family=Source+Serif+Pro:ital,wght@0,400;0,700;1,400;1,700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'Source Serif Pro',
    italic: true,
    postscriptName: 'SourceSerifPro-Italic',
    style: 'Italic',
    weight: 400,
  },
  {
    family: 'Source Serif Pro',
    italic: false,
    postscriptName: 'SourceSerifPro-Bold',
    style: 'Bold',
    weight: 700,
  },
  {
    family: 'Source Serif Pro',
    italic: true,
    postscriptName: 'SourceSerifPro-BoldItalic',
    style: 'Bold Italic',
    weight: 700,
  },

  // Zilla Slab
  {
    family: 'zilla Slab',
    italic: false,
    postscriptName: 'ZillaSlab-Regular',
    queryString: 'family=Zilla+Slab:ital,wght@0,400;0,700;1,400;1,700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'zilla Slab',
    italic: true,
    postscriptName: 'ZillaSlab-Italic',
    style: 'Italic',
    weight: 400,
  },
  {
    family: 'zilla Slab',
    italic: false,
    postscriptName: 'ZillaSlab-Bold',
    style: 'Bold',
    weight: 700,
  },
  {
    family: 'zilla Slab',
    italic: true,
    postscriptName: 'ZillaSlab-BoldItalic',
    style: 'Bold Italic',
    weight: 700,
  },

  // Arsenal
  {
    family: 'arsenal',
    italic: false,
    postscriptName: 'Arsenal-Regular',
    queryString: 'family=Arsenal:ital,wght@0,400;0,700;1,400;1,700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'arsenal',
    italic: true,
    postscriptName: 'Arsenal-Italic',
    style: 'Italic',
    weight: 400,
  },
  {
    family: 'arsenal',
    italic: false,
    postscriptName: 'Arsenal-Bold',
    style: 'Bold',
    weight: 700,
  },
  {
    family: 'arsenal',
    italic: true,
    postscriptName: 'Arsenal-BoldItalic',
    style: 'Bold Italic',
    weight: 700,
  },
  // Rubik
  {
    family: 'Rubik',
    italic: false,
    postscriptName: 'Rubik-Regular',
    queryString: 'family=Rubik:ital,wght@0,400;0,700;1,400;1,700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'Rubik',
    italic: true,
    postscriptName: 'Rubik-Italic',
    style: 'Italic',
    weight: 400,
  },
  {
    family: 'Rubik',
    italic: false,
    postscriptName: 'Rubik-Bold',
    style: 'Bold',
    weight: 700,
  },
  {
    family: 'Rubik',
    italic: true,
    postscriptName: 'Rubik-BoldItalic',
    style: 'Bold Italic',
    weight: 700,
  },

  // Libre Franklin
  {
    family: 'libre franklin',
    italic: false,
    postscriptName: 'LibreFranklin-Regular',
    queryString: 'family=Libre+Franklin:ital,wght@0,400;0,700;1,400;1,700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'libre franklin',
    italic: true,
    postscriptName: 'LibreFranklin-Italic',
    style: 'Italic',
    weight: 400,
  },
  {
    family: 'libre franklin',
    italic: false,
    postscriptName: 'LibreFranklin-Bold',
    style: 'Bold',
    weight: 700,
  },
  {
    family: 'libre franklin',
    italic: true,
    postscriptName: 'LibreFranklin-BoldItalic',
    style: 'Bold Italic',
    weight: 700,
  },

  // Josefin Sans
  {
    family: 'josefin sans',
    italic: false,
    postscriptName: 'JosefinSans-Regular',
    queryString: 'family=Josefin+Sans:ital,wght@0,400;0,700;1,400;1,700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'josefin sans',
    italic: true,
    postscriptName: 'JosefinSans-Italic',
    style: 'Italic',
    weight: 400,
  },
  {
    family: 'josefin sans',
    italic: false,
    postscriptName: 'JosefinSans-Bold',
    style: 'Bold',
    weight: 700,
  },
  {
    family: 'josefin sans',
    italic: true,
    postscriptName: 'JosefinSans-BoldItalic',
    style: 'Bold Italic',
    weight: 700,
  },

  // Poppins
  {
    family: 'poppins',
    italic: false,
    postscriptName: 'Poppins-Regular',
    queryString: 'family=Poppins:ital,wght@0,400;0,700;1,400;1,700',
    style: 'Regular',
    weight: 400,
  },
  {
    family: 'poppins',
    italic: true,
    postscriptName: 'Poppins-Italic',
    style: 'Italic',
    weight: 400,
  },
  {
    family: 'poppins',
    italic: false,
    postscriptName: 'Poppins-Bold',
    style: 'Bold',
    weight: 700,
  },
  {
    family: 'poppins',
    italic: true,
    postscriptName: 'Poppins-BoldItalic',
    style: 'Bold Italic',
    weight: 700,
  },

  // Lobster
  {
    family: 'lobster',
    italic: false,
    postscriptName: 'Lobster-Regular',
    queryString: 'family=Lobster',
    style: 'Regular',
    weight: 400,
  },

  // Pacifico
  {
    family: 'pacifico',
    italic: false,
    postscriptName: 'Pacifico-Regular',
    queryString: 'family=Pacifico',
    style: 'Regular',
    weight: 400,
  },
  // Yomogi
  {
    family: 'yomogi',
    italic: false,
    postscriptName: 'Yomogi-Regular',
    queryString: 'family=Yomogi',
    style: 'Regular',
    supportLangs: ['ja', 'zh-tw'],
    weight: 400,
  },

  // Dela Gothic One
  {
    family: 'Dela Gothic One',
    italic: false,
    postscriptName: 'DelaGothicOne-Regular',
    queryString: 'family=Dela+Gothic+One',
    style: 'Regular',
    supportLangs: ['ja', 'zh-tw'],
    weight: 400,
  },
  // Potta_One
  {
    family: 'potta One',
    italic: false,
    postscriptName: 'PottaOne-Regular',
    queryString: 'family=Potta+One',
    style: 'Regular',
    supportLangs: ['ja', 'zh-tw'],
    weight: 400,
  },

  // Train_One
  {
    family: 'train One',
    italic: false,
    postscriptName: 'TrainOne-Regular',
    queryString: 'family=Train+One',
    style: 'Regular',
    supportLangs: ['ja', 'zh-tw'],
    weight: 400,
  },

  // Stick
  {
    family: 'STICK',
    italic: false,
    postscriptName: 'Stick-Regular',
    queryString: 'family=Stick',
    style: 'Regular',
    supportLangs: ['ja', 'zh-tw'],
    weight: 400,
  },

  // Reggae_One
  {
    family: 'reggae One',
    italic: false,
    postscriptName: 'ReggaeOne-Regular',
    queryString: 'family=Reggae+One',
    style: 'Regular',
    supportLangs: ['ja', 'zh-tw'],
    weight: 400,
  },

  // RocknRoll_One
  {
    family: 'rocknRoll One',
    italic: false,
    postscriptName: 'RocknRollOne-Regular',
    queryString: 'family=RocknRoll+One',
    style: 'Regular',
    supportLangs: ['ja', 'zh-tw'],
    weight: 400,
  },

  // DotGothic16
  {
    family: 'DotGothic16',
    italic: false,
    postscriptName: 'DotGothic16-Regular',
    queryString: 'family=DotGothic16',
    style: 'Regular',
    supportLangs: ['ja', 'zh-tw'],
    weight: 400,
  },

  // Palette Mosaic
  {
    family: 'palette Mosaic',
    italic: false,
    postscriptName: 'PaletteMosaic-Regular',
    queryString: 'family=Palette+Mosaic',
    style: 'Regular',
    supportLangs: ['ja'],
    weight: 400,
  },

  // M PLUS Rounded 1c
  {
    family: 'M PLUS Rounded 1c',
    italic: false,
    postscriptName: 'MPLUSRounded1c-Regular',
    queryString: 'family=M+PLUS+Rounded+1c:wght@400;700',
    style: 'Regular',
    supportLangs: ['ja'],
    weight: 400,
  },
  {
    family: 'M PLUS Rounded 1c',
    italic: false,
    postscriptName: 'MPLUSRounded1c-Bold',
    style: 'Bold',
    supportLangs: ['ja'],
    weight: 700,
  },

  // M PLUS 1p
  {
    family: 'm plus 1p',
    italic: false,
    postscriptName: 'MPLUS1p-Regular',
    queryString: 'family=M+PLUS+1p:wght@400;700',
    style: 'Regular',
    supportLangs: ['ja'],
    weight: 400,
  },
  {
    family: 'm plus 1p',
    italic: false,
    postscriptName: 'MPLUS1p-Bold',
    style: 'Bold',
    supportLangs: ['ja'],
    weight: 700,
  },
  // Sawarabi Mincho
  {
    family: 'Sawarabi mincho',
    italic: false,
    postscriptName: 'SawarabiMincho-Regular',
    queryString: 'family=Sawarabi+Mincho',
    style: 'Regular',
    supportLangs: ['ja'],
    weight: 400,
  },
  // Sawarabi Gothic
  {
    family: 'sawarabi Gothic',
    italic: false,
    postscriptName: 'SawarabiGothic-Regular',
    queryString: 'family=Sawarabi+Gothic',
    style: 'Regular',
    supportLangs: ['ja'],
    weight: 400,
  },

  // Kosugi
  {
    family: 'Kosugi',
    italic: false,
    postscriptName: 'Kosugi-Regular',
    queryString: 'family=Kosugi',
    style: 'Regular',
    supportLangs: ['ja'],
    weight: 400,
  },

  // Shippori Mincho
  {
    family: 'Shippori Mincho',
    italic: false,
    postscriptName: 'ShipporiMincho-Regular',
    queryString: 'family=Shippori+Mincho:wght@400;700',
    style: 'Regular',
    supportLangs: ['ja', 'zh-tw'],
    weight: 400,
  },
  {
    family: 'Shippori Mincho',
    italic: false,
    postscriptName: 'ShipporiMincho-Bold',
    style: 'Bold',
    supportLangs: ['ja', 'zh-tw'],
    weight: 700,
  },

  // Shippori Mincho B1
  {
    family: 'Shippori Mincho B1',
    italic: false,
    postscriptName: 'ShipporiMinchoB1-Regular',
    queryString: 'family=Shippori+Mincho+B1:wght@400;700',
    style: 'Regular',
    supportLangs: ['ja', 'zh-tw'],
    weight: 400,
  },
  {
    family: 'Shippori Mincho B1',
    italic: false,
    postscriptName: 'ShipporiMinchoB1-Bold',
    style: 'Bold',
    supportLangs: ['ja', 'zh-tw'],
    weight: 700,
  },

  // Kiwi Maru
  {
    family: 'Kiwi Maru',
    italic: false,
    postscriptName: 'KiwiMaru-Regular',
    queryString: 'family=Kiwi+Maru',
    style: 'Regular',
    supportLangs: ['ja', 'zh-tw'],
    weight: 400,
  },

  // Hachi Maru Pop
  {
    family: 'hachi maru pop',
    italic: false,
    postscriptName: 'HachiMaruPop-Regular',
    queryString: 'family=Hachi+Maru+Pop',
    style: 'Regular',
    supportLangs: ['ja', 'zh-tw'],
    weight: 400,
  },

  // Yusei Magic
  {
    family: 'Yusei Magic',
    italic: false,
    postscriptName: 'YuseiMagic-Regular',
    queryString: 'family=Yusei+Magic',
    style: 'Regular',
    supportLangs: ['ja', 'zh-tw'],
    weight: 400,
  },

  // Otomanopee One
  {
    family: 'Otomanopee One',
    italic: false,
    postscriptName: 'OtomanopeeOne-Regular',
    queryString: 'family=Otomanopee+One',
    style: 'Regular',
    supportLangs: ['ja'],
    weight: 400,
  },

  // New Tegomin
  {
    family: 'New Tegomin',
    italic: false,
    postscriptName: 'NewTegomin-Regular',
    queryString: 'family=New+Tegomin',
    style: 'Regular',
    supportLangs: ['ja', 'zh-tw'],
    weight: 400,
  },

  // ZCOOL XiaoWei
  {
    family: 'ZCOOL xiaowei',
    italic: false,
    postscriptName: 'ZCOOLXiaoWei-Regular',
    queryString: 'family=ZCOOL+XiaoWei',
    style: 'Regular',
    supportLangs: ['zh-cn'],
    weight: 400,
  },

  // ZCOOL QingKe HuangYou
  {
    family: 'ZCOOL QingKe HuangYou',
    italic: false,
    postscriptName: 'ZCOOLQingKeHuangYou-Regular',
    queryString: 'family=ZCOOL+QingKe+HuangYou',
    style: 'Regular',
    supportLangs: ['zh-cn', 'zh-tw'],
    weight: 400,
  },

  // Ma Shan Zheng
  {
    family: 'Ma Shan Zheng',
    italic: false,
    postscriptName: 'MaShanZheng-Regular',
    queryString: 'family=Ma+Shan+Zheng',
    style: 'Regular',
    supportLangs: ['zh-cn'],
    weight: 400,
  },

  // ZCOOL KuaiLe
  {
    family: 'ZCOOL kuaile',
    italic: false,
    postscriptName: 'ZCOOLKuaiLe-Regular',
    queryString: 'family=ZCOOL+KuaiLe',
    style: 'Regular',
    supportLangs: ['zh-cn'],
    weight: 400,
  },

  // long cang
  {
    family: 'long cang',
    italic: false,
    postscriptName: 'LongCang-Regular',
    queryString: 'family=Long+Cang',
    style: 'Regular',
    supportLangs: ['zh-cn'],
    weight: 400,
  },

  // Liu Jian Mao Cao
  {
    family: 'Liu Jian Mao Cao',
    italic: false,
    postscriptName: 'LiuJianMaoCao-Regular',
    queryString: 'family=Liu+Jian+Mao+Cao',
    style: 'Regular',
    supportLangs: ['zh-cn'],
    weight: 400,
  },

  // Zhi Mang Xing
  {
    family: 'Zhi Mang Xing',
    italic: false,
    postscriptName: 'ZhiMangXing-Regular',
    queryString: 'family=Zhi+Mang+Xing',
    style: 'Regular',
    supportLangs: ['zh-cn'],
    weight: 400,
  },
];

const applyStyle = (fontsInUse: WebFont[]): void => {
  const query = fontsInUse
    .filter((font) => font.queryString)
    .map((font) => font.queryString)
    .join('&');

  const queryString = `https://fonts.googleapis.com/css2?${query}&display=swap`;
  const link = document.createElement('link');

  link.setAttribute('href', queryString);
  link.setAttribute('rel', 'stylesheet');

  const head = document.querySelector('head');

  head?.appendChild(link);
};

const getAvailableFonts = (lang: string): WebFont[] =>
  fonts.filter((font) => {
    if (!font.supportLangs) {
      return true;
    }

    return font.supportLangs.includes(lang);
  });

export default {
  applyStyle,
  getAvailableFonts,
};
