import { WebFont } from 'interfaces/IFont';

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
    style: 'Regular',
    weight: 400,
    queryString: 'family=Noto+Sans:ital,wght@0,400;0,700;1,400;1,700',
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
    italic: false,
    postscriptName: 'NotoSansTC-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Noto+Sans+TC:wght@400;700',
    fileName: 'NotoSansTC-Regular.otf',
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
    italic: false,
    postscriptName: 'NotoSansTC-Bold',
    style: 'Bold',
    weight: 700,
    fileName: 'NotoSansTC-Bold.otf',
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
    italic: false,
    postscriptName: 'NotoSansHK-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Noto+Sans+HK:wght@400;700',
    fileName: 'NotoSansHK-Regular.otf',
  },
  {
    family: 'Noto Sans HK',
    italic: false,
    postscriptName: 'NotoSansHK-Bold',
    style: 'Bold',
    weight: 700,
    fileName: 'NotoSansHK-Bold.otf',
  },

  // Noto Sans SC
  {
    family: 'Noto Sans SC',
    italic: false,
    postscriptName: 'NotoSansSC-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Noto+Sans+SC:wght@400;700',
    fileName: 'NotoSansSC-Regular.otf',
  },
  {
    family: 'Noto Sans SC',
    italic: false,
    postscriptName: 'NotoSansSC-Bold',
    style: 'Bold',
    weight: 700,
    fileName: 'NotoSansSC-Bold.otf',
  },

  // Noto Sans JP
  {
    family: 'Noto Sans JP',
    italic: false,
    postscriptName: 'NotoSansJP-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Noto+Sans+JP:wght@400;700',
    fileName: 'NotoSansJP-Regular.otf',
  },
  {
    family: 'Noto Sans JP',
    italic: false,
    postscriptName: 'NotoSansJP-Bold',
    style: 'Bold',
    weight: 700,
    fileName: 'NotoSansJP-Bold.otf',
  },

  // Noto Sans KR
  {
    family: 'Noto Sans KR',
    italic: false,
    postscriptName: 'NotoSansKR-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Noto+Sans+KR:wght@400;700',
    fileName: 'NotoSansKR-Regular.otf',
  },
  {
    family: 'Noto Sans KR',
    italic: false,
    postscriptName: 'NotoSansKR-Bold',
    style: 'Bold',
    weight: 700,
    fileName: 'NotoSansKR-Bold.otf',
  },

  // Noto Serif
  {
    family: 'Noto Serif',
    italic: false,
    postscriptName: 'NotoSerif-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Noto+Serif:ital,wght@0,400;0,700;1,400;1,700',
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
    italic: false,
    postscriptName: 'NotoSerifTC-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Noto+Serif+TC:wght@400;700',
    fileName: 'NotoSerifTC-Regular.otf',
  },
  {
    family: 'Noto Serif TC',
    italic: false,
    postscriptName: 'NotoSerifTC-Bold',
    style: 'Bold',
    weight: 700,
    fileName: 'NotoSerifTC-Bold.otf',
  },

  // Noto Serif SC
  {
    family: 'Noto Serif SC',
    italic: false,
    postscriptName: 'NotoSerifSC-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Noto+Serif+SC:wght@400;700',
    fileName: 'NotoSerifSC-Regular.otf',
  },
  {
    family: 'Noto Serif SC',
    italic: false,
    postscriptName: 'NotoSerifSC-Bold',
    style: 'Bold',
    weight: 700,
    fileName: 'NotoSerifSC-Bold.otf',
  },

  // Noto Serif JP
  {
    family: 'Noto Serif JP',
    italic: false,
    postscriptName: 'NotoSerifJP-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Noto+Serif+JP:wght@400;700',
    fileName: 'NotoSerifJP-Regular.otf',
  },
  {
    family: 'Noto Serif JP',
    italic: false,
    postscriptName: 'NotoSerifJP-Bold',
    style: 'Bold',
    weight: 700,
    fileName: 'NotoSerifJP-Bold.otf',
  },

  // Noto Serif KR
  {
    family: 'Noto Serif KR',
    italic: false,
    postscriptName: 'NotoSerifKR-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Noto+Serif+KR:wght@400;700',
    fileName: 'NotoSerifKR-Regular.otf',
  },
  {
    family: 'Noto Serif KR',
    italic: false,
    postscriptName: 'NotoSerifKR-Bold',
    style: 'Bold',
    weight: 700,
    fileName: 'NotoSerifKR-Bold.otf',
  },

  // Open Sans
  {
    family: 'Open Sans',
    italic: false,
    postscriptName: 'OpenSans-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700',
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
    style: 'Regular',
    weight: 400,
    queryString: 'family=Arimo:ital,wght@0,400;0,700;1,400;1,700',
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
    style: 'Regular',
    weight: 400,
    queryString: 'family=Comic+Neue:ital,wght@0,400;0,700;1,400;1,700',
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
    style: 'Regular',
    weight: 400,
    queryString: 'family=Fira+Sans:ital,wght@0,400;0,700;1,400;1,700',
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
    style: 'Regular',
    weight: 400,
    queryString: 'family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700',
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
    style: 'Regular',
    weight: 400,
    queryString: 'family=Tinos:ital,wght@0,400;0,700;1,400;1,700',
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
    style: 'Regular',
    weight: 400,
    queryString: 'family=Oswald:wght@400;700',
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
    style: 'Regular',
    weight: 400,
    queryString: 'family=Lato:ital,wght@0,400;0,700;1,400;1,700',
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
    style: 'Regular',
    weight: 400,
    queryString: 'family=Roboto:ital,wght@0,400;0,700;1,400;1,700',
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
    style: 'Regular',
    weight: 400,
    queryString: 'family=Montserrat:ital,wght@0,400;0,700;1,400;1,700',
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
    style: 'Regular',
    weight: 400,
    queryString: 'family=Source+Serif+Pro:ital,wght@0,400;0,700;1,400;1,700',
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
    style: 'Regular',
    weight: 400,
    queryString: 'family=Zilla+Slab:ital,wght@0,400;0,700;1,400;1,700',
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
    style: 'Regular',
    weight: 400,
    queryString: 'family=Arsenal:ital,wght@0,400;0,700;1,400;1,700',
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
    style: 'Regular',
    weight: 400,
    queryString: 'family=Rubik:ital,wght@0,400;0,700;1,400;1,700',
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
    style: 'Regular',
    weight: 400,
    queryString: 'family=Libre+Franklin:ital,wght@0,400;0,700;1,400;1,700',
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
    style: 'Regular',
    weight: 400,
    queryString: 'family=Josefin+Sans:ital,wght@0,400;0,700;1,400;1,700',
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
    style: 'Regular',
    weight: 400,
    queryString: 'family=Poppins:ital,wght@0,400;0,700;1,400;1,700',
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
    style: 'Regular',
    weight: 400,
    queryString: 'family=Lobster',
  },

  // Pacifico
  {
    family: 'pacifico',
    italic: false,
    postscriptName: 'Pacifico-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Pacifico',
  },
  // Yomogi
  {
    family: 'yomogi',
    italic: false,
    postscriptName: 'Yomogi-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Yomogi',
    supportLangs: ['ja', 'zh-tw'],
  },

  // Dela Gothic One
  {
    family: 'Dela Gothic One',
    italic: false,
    postscriptName: 'DelaGothicOne-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Dela+Gothic+One',
    supportLangs: ['ja', 'zh-tw'],
  },
  // Potta_One
  {
    family: 'potta One',
    italic: false,
    postscriptName: 'PottaOne-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Potta+One',
    supportLangs: ['ja', 'zh-tw'],
  },

  // Train_One
  {
    family: 'train One',
    italic: false,
    postscriptName: 'TrainOne-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Train+One',
    supportLangs: ['ja', 'zh-tw'],
  },

  // Stick
  {
    family: 'STICK',
    italic: false,
    postscriptName: 'Stick-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Stick',
    supportLangs: ['ja', 'zh-tw'],
  },

  // Reggae_One
  {
    family: 'reggae One',
    italic: false,
    postscriptName: 'ReggaeOne-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Reggae+One',
    supportLangs: ['ja', 'zh-tw'],
  },

  // RocknRoll_One
  {
    family: 'rocknRoll One',
    italic: false,
    postscriptName: 'RocknRollOne-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=RocknRoll+One',
    supportLangs: ['ja', 'zh-tw'],
  },

  // DotGothic16
  {
    family: 'DotGothic16',
    italic: false,
    postscriptName: 'DotGothic16-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=DotGothic16',
    supportLangs: ['ja', 'zh-tw'],
  },

  // Palette Mosaic
  {
    family: 'palette Mosaic',
    italic: false,
    postscriptName: 'PaletteMosaic-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Palette+Mosaic',
    supportLangs: ['ja'],
  },

  // M PLUS Rounded 1c
  {
    family: 'M PLUS Rounded 1c',
    italic: false,
    postscriptName: 'MPLUSRounded1c-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=M+PLUS+Rounded+1c:wght@400;700',
    supportLangs: ['ja'],
  },
  {
    family: 'M PLUS Rounded 1c',
    italic: false,
    postscriptName: 'MPLUSRounded1c-Bold',
    style: 'Bold',
    weight: 700,
    supportLangs: ['ja'],
  },

  // M PLUS 1p
  {
    family: 'm plus 1p',
    italic: false,
    postscriptName: 'MPLUS1p-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=M+PLUS+1p:wght@400;700',
    supportLangs: ['ja'],
  },
  {
    family: 'm plus 1p',
    italic: false,
    postscriptName: 'MPLUS1p-Bold',
    style: 'Bold',
    weight: 700,
    supportLangs: ['ja'],
  },
  // Sawarabi Mincho
  {
    family: 'Sawarabi mincho',
    italic: false,
    postscriptName: 'SawarabiMincho-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Sawarabi+Mincho',
    supportLangs: ['ja'],
  },
  // Sawarabi Gothic
  {
    family: 'sawarabi Gothic',
    italic: false,
    postscriptName: 'SawarabiGothic-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Sawarabi+Gothic',
    supportLangs: ['ja'],
  },

  // Kosugi
  {
    family: 'Kosugi',
    italic: false,
    postscriptName: 'Kosugi-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Kosugi',
    supportLangs: ['ja'],
  },

  // Shippori Mincho
  {
    family: 'Shippori Mincho',
    italic: false,
    postscriptName: 'ShipporiMincho-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Shippori+Mincho:wght@400;700',
    supportLangs: ['ja', 'zh-tw'],
  },
  {
    family: 'Shippori Mincho',
    italic: false,
    postscriptName: 'ShipporiMincho-Bold',
    style: 'Bold',
    weight: 700,
    supportLangs: ['ja', 'zh-tw'],
  },

  // Shippori Mincho B1
  {
    family: 'Shippori Mincho B1',
    italic: false,
    postscriptName: 'ShipporiMinchoB1-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Shippori+Mincho+B1:wght@400;700',
    supportLangs: ['ja', 'zh-tw'],
  },
  {
    family: 'Shippori Mincho B1',
    italic: false,
    postscriptName: 'ShipporiMinchoB1-Bold',
    style: 'Bold',
    weight: 700,
    supportLangs: ['ja', 'zh-tw'],
  },

  // Kiwi Maru
  {
    family: 'Kiwi Maru',
    italic: false,
    postscriptName: 'KiwiMaru-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Kiwi+Maru',
    supportLangs: ['ja', 'zh-tw'],
  },

  // Hachi Maru Pop
  {
    family: 'hachi maru pop',
    italic: false,
    postscriptName: 'HachiMaruPop-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Hachi+Maru+Pop',
    supportLangs: ['ja', 'zh-tw'],
  },

  // Yusei Magic
  {
    family: 'Yusei Magic',
    italic: false,
    postscriptName: 'YuseiMagic-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Yusei+Magic',
    supportLangs: ['ja', 'zh-tw'],
  },

  // Otomanopee One
  {
    family: 'Otomanopee One',
    italic: false,
    postscriptName: 'OtomanopeeOne-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Otomanopee+One',
    supportLangs: ['ja'],
  },

  // New Tegomin
  {
    family: 'New Tegomin',
    italic: false,
    postscriptName: 'NewTegomin-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=New+Tegomin',
    supportLangs: ['ja', 'zh-tw'],
  },

  // ZCOOL XiaoWei
  {
    family: 'ZCOOL xiaowei',
    italic: false,
    postscriptName: 'ZCOOLXiaoWei-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=ZCOOL+XiaoWei',
    supportLangs: ['zh-cn'],
  },

  // ZCOOL QingKe HuangYou
  {
    family: 'ZCOOL QingKe HuangYou',
    italic: false,
    postscriptName: 'ZCOOLQingKeHuangYou-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=ZCOOL+QingKe+HuangYou',
    supportLangs: ['zh-cn', 'zh-tw'],
  },

  // Ma Shan Zheng
  {
    family: 'Ma Shan Zheng',
    italic: false,
    postscriptName: 'MaShanZheng-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Ma+Shan+Zheng',
    supportLangs: ['zh-cn'],
  },

  // ZCOOL KuaiLe
  {
    family: 'ZCOOL kuaile',
    italic: false,
    postscriptName: 'ZCOOLKuaiLe-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=ZCOOL+KuaiLe',
    supportLangs: ['zh-cn'],
  },

  // long cang
  {
    family: 'long cang',
    italic: false,
    postscriptName: 'LongCang-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Long+Cang',
    supportLangs: ['zh-cn'],
  },

  // Liu Jian Mao Cao
  {
    family: 'Liu Jian Mao Cao',
    italic: false,
    postscriptName: 'LiuJianMaoCao-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Liu+Jian+Mao+Cao',
    supportLangs: ['zh-cn'],
  },

  // Zhi Mang Xing
  {
    family: 'Zhi Mang Xing',
    italic: false,
    postscriptName: 'ZhiMangXing-Regular',
    style: 'Regular',
    weight: 400,
    queryString: 'family=Zhi+Mang+Xing',
    supportLangs: ['zh-cn'],
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
    if (!font.supportLangs) return true;
    return font.supportLangs.includes(lang);
  });

export default {
  getAvailableFonts,
  applyStyle,
};
