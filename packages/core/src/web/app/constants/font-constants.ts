// lang refs: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
// https://stackoverflow.com/questions/14563064/japanese-standard-web-fonts
// https://en.wikipedia.org/wiki/List_of_CJK_fonts#Sans-serif

const fontConstants: {
  [lang: string]: {
    MacOS?: string,
    Windows?: string,
    Linux?: string,
    web?: string,
  }
} = {
  'zh-CN': {
    MacOS: 'STHeiti',
    Windows: 'Microsoft YaHei',
    Linux: 'Ubuntu',
    web: 'Noto Sans SC',
  },
  'zh-TW': {
    MacOS: 'Heiti TC',
    Windows: '微軟正黑體',
    Linux: 'Ubuntu',
    web: 'Noto Sans TC',
  },
  ja: {
    MacOS: 'Hiragino Maru Gothic ProN',
    Windows: 'Meiryo',
    Linux: 'Ubuntu',
    web: 'Noto Sans JP',
  },
  ko: {
    MacOS: 'Apple SD Gothic Neo',
    Windows: 'Malgun Gothic',
    Linux: 'Ubuntu',
    web: 'Noto Sans KR',
  },
};

export default fontConstants;
