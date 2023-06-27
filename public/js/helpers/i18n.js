define([
    'helpers/local-storage',
    'app/app-settings',
    'app/lang/de',
    'app/lang/en',
    'app/lang/zh-tw',
    'app/lang/ja',
    'app/lang/zh-cn',
], function(localStorage, AppSettings, LangDe, LangEn, LangZHTW, LangJa, LangZHCN, LangKr, LangPt) {
    'use strict';

    var ACTIVE_LANG = 'active-lang',
        langCache = {
            'de': LangDe,
            'en': LangEn,
            'zh-tw': LangZHTW,
            'ja': LangJa,
            'zh-cn': LangZHCN,
            'kr': LangKr,
            'pt': LangPt
        },
        activeLang = localStorage.get(ACTIVE_LANG) || AppSettings.i18n.default_lang,
        currentLang;

    return {
        /**
         * set active language
         *
         * @param {string} language code in lower case
         *
         * @return string
         */
        getActiveLang : function() {
            return localStorage.get(ACTIVE_LANG) || AppSettings.i18n.default_lang;
        },

        /**
         * set active language
         *
         * @param {string} language code in lower case
         *
         * @return this
         */
        setActiveLang : function(lang) {
            currentLang = undefined;
            activeLang = lang;
            localStorage.set(ACTIVE_LANG, lang);

            return this;
        },

        /**
         * get from key
         *
         * @param {string} the key that obtains i18n string. seperate by '.'
         * @param {json}   bind string with args
         *
         * @return mixed
         */
        get : function(key, args) {
            key = key || '';

            var keys = key.split('.'),
                currentLangCode = this.getActiveLang(),
                temp, line;

            // caching
            if ('undefined' === typeof currentLang) {
                currentLang = langCache[currentLangCode];
            }

            temp = line = currentLang;

            keys.forEach(function(key, i) {
                if ('' !== key) {
                    if ('undefined' !== typeof temp && true === temp.hasOwnProperty(key)) {
                        temp = line = temp[key];
                    }
                    else {
                        throw new Error('KEY "' + keys.join('.') + '" IS NOT EXISTING');
                    }
                }
            });

            return line;
        },
        get lang() {
            return langCache[activeLang];
        }
    };
});
