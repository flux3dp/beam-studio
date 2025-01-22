// lang refs: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
// https://stackoverflow.com/questions/14563064/japanese-standard-web-fonts
// https://en.wikipedia.org/wiki/List_of_CJK_fonts#Sans-serif

const fontConstants: {
  [lang: string]: {
    Linux?: string;
    MacOS?: string;
    web?: string;
    Windows?: string;
  };
} = {
  ja: {
    Linux: 'Ubuntu',
    MacOS: 'Hiragino Maru Gothic ProN',
    web: 'Noto Sans JP',
    Windows: 'Meiryo',
  },
  ko: {
    Linux: 'Ubuntu',
    MacOS: 'Apple SD Gothic Neo',
    web: 'Noto Sans KR',
    Windows: 'Malgun Gothic',
  },
  'zh-CN': {
    Linux: 'Ubuntu',
    MacOS: 'STHeiti',
    web: 'Noto Sans SC',
    Windows: 'Microsoft YaHei',
  },
  'zh-TW': {
    Linux: 'Ubuntu',
    MacOS: 'Heiti TC',
    web: 'Noto Sans TC',
    Windows: '微軟正黑體',
  },
};

export default fontConstants;
