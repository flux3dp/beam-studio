import storage from './storage-helper';
import AppSettings from '../app/app-settings';
import LangDe from '../app/lang/de';
import LangEn from '../app/lang/en';
import LangEs from '../app/lang/es';
import LangJa from '../app/lang/ja';
import LangZHTW from '../app/lang/zh-tw';
import LangZHCN from '../app/lang/zh-cn';
import { ILang } from 'interfaces/ILang';

const ACTIVE_LANG = 'active-lang',
    langCache = {
        'de': LangDe,
        'en': LangEn,
        'es': LangEs,
        'zh-tw': LangZHTW,
        'ja': LangJa,
        'zh-cn': LangZHCN,
    };

// TODO: Difference between activeLang and currentLang?
let activeLang = storage.get(ACTIVE_LANG) as string || AppSettings.i18n.default_lang;
let currentLang;

/**
 * set active language
 *
 * @param {string} language code in lower case
 *
 * @return string
 */
export function getActiveLang(): string {
    return storage.get(ACTIVE_LANG) as string || AppSettings.i18n.default_lang;
}

/**
 * set active language
 *
 * @param {string} language code in lower case
 *
 * @return this
 */
export function setActiveLang(lang: string) {
    currentLang = undefined;
    activeLang = lang;
    storage.set(ACTIVE_LANG, lang);

    return this;
}

/**
 * get from key
 *
 * @param {string} the key that obtains i18n string. seperate by '.'
 * @param {json}   bind string with args
 *
 * @return mixed
 */
export function get(key, args) {
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
};

class LangCacheHelper {
    static get lang(): ILang {
        return langCache[activeLang];
    };
} 

export const lang = LangCacheHelper.lang;

export default {
    getActiveLang,
    setActiveLang,
    get,
    get lang() {
        return langCache[activeLang] as ILang;
    }
};
