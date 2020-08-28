
define(function() {
    'use strict';
    // lang refs: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
    // https://stackoverflow.com/questions/14563064/japanese-standard-web-fonts
    // https://en.wikipedia.org/wiki/List_of_CJK_fonts#Sans-serif

    return {
        'zh-CN': {
            darwin: 'STHeiti',
            win32: 'Microsoft YaHei',
        },
        'zh-TW': {
            darwin: 'Heiti TC',
            win32: '微軟正黑體',
        },
        'ja': {
            darwin: 'Hiragino Maru Gothic ProN',
            win32: 'Meiryo',
        },
        'ko': {
            darwin: 'Apple SD Gothic Neo',
            win32: 'Malgun Gothic',
        }
    };
});