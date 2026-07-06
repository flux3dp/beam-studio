import TopBarController from '@core/app/components/beambox/TopBar/contexts/TopBarController';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';

import deviceMaster from './device-master';
import i18n from './i18n';

export type Category = 'bap' | 'common' | WorkAreaModel;

// Note: HELP_CENTER_ARTICLES is just a constant map for error code to article id, not guaranteed to be displayed in corresponding situations
// Please check the codebase for the actual logic of showing help center links
// 1. dialogs/Alert.tsx: i18n (and player report)
// 2. translateError.ts: device cmd return message
// Also, some articles are hardcoded in `lang/` folder and might be displayed twice if the error code is also mapped to an article id in HELP_CENTER_ARTICLES
export const HELP_CENTER_ARTICLES: Record<number, Partial<Record<Category, number>>> = {
  401: {
    fbm1: 4402854376079,
  },
  402: {
    fbm1: 4402854398095,
  },
  801: {
    common: 360001809676,
  },
  802: {
    common: 360001809776,
  },
  803: {
    ado1: 9547633525135,
    common: 360001791895,
  },
  804: {
    common: 360001792035,
    fbb1b: 7669227556751,
  },
  805: {
    common: 360001811076,
  },
  806: {
    common: 360001811236,
  },
  807: {
    common: 360001792895,
  },
  808: {
    common: 360001811276,
  },
  809: {
    common: 360001792915,
  },
  810: {
    common: 360001811316,
  },
  811: {
    common: 360001792955,
  },
  812: {
    common: 360001811336,
  },
  813: {
    common: 360001811356,
  },
  814: {
    common: 360001811376,
  },
  815: {
    common: 360001811416,
  },
  816: {
    common: 360001811456,
  },
  817: {
    common: 360001811476,
  },
  818: {
    common: 360001793055,
  },
  819: {
    common: 360001793755,
  },
  820: {
    common: 360001812496,
  },
  821: {
    common: 360001793775,
  },
  822: {
    common: 360001793795,
  },
  823: {
    common: 360001812656,
  },
  824: {
    common: 360001794515,
  },
  825: {
    common: 360001814476,
  },
  826: {
    common: 360001814656,
  },
  827: {
    common: 360001795275,
  },
  828: {
    common: 360001814676,
  },
  829: {
    common: 360001795295,
  },
  830: {
    common: 360001795415,
  },
  840: {
    common: 4402728633487,
  },
  841: {
    common: 4402728736271,
  },
  842: {
    common: 4402728833807,
  },
  843: {
    common: 4402854473615,
  },
  844: {
    common: 4402755805071,
  },
  845: {
    common: 4402756056079,
  },
  846: {
    common: 4402861605775,
  },
  847: {
    common: 4402854250127,
  },
  850: {
    common: 11300866366223,
  },
  851: {
    common: 11300854461711,
  },
  900: {
    fbb1b: 360001360535,
    fbb2: 10814825395983,
    fbm1: 4405448439439,
    fbm2: 14166917446031,
    fhexa1: 4410592755215,
  },
  901: {
    ado1: 7661453154703,
    fbb1b: 360001364996,
    fbb2: 10814819040783,
    fbm1: 4405448443407,
    fbm2: 14166904431759,
    fhexa1: 4410609251215,
    fhx2rf: 14811531232911,
  },
  902: {
    fbb1b: 360001364976,
    fbb2: 10814819414927,
    fbm1: 4405454667023,
    fbm2: 14166906026127,
    fhexa1: 4410621227535,
  },
  903: {
    ado1: 8378609291279,
    fbb2: 10814819705103,
    fbm1: 4405454668687,
    fbm2: 14108393763471,
  },
  904: {
    ado1: 7661390110223,
    fbb1b: 360001360515,
    fbb2: 10814847067791,
    fbm1: 4405454670991,
    fbm2: 14166890705295,
    fhexa1: 4410621275919,
    fhx2rf: 14811500990863,
  },
  905: {
    fbm1: 4402854459791,
  },
  910: {
    fbb2: 10814887892623,
    fbm2: 14166909036687,
    fhexa1: 4410621416975,
    fhx2rf: 14811484479247,
  },
  911: {
    fhexa1: 4410621469583,
  },
  912: {
    fbb2: 10814853837967,
    fbm2: 14166938370447,
    fhexa1: 4410629814671,
    fhx2rf: 14811444964879,
  },
  913: {
    fbb2: 10814887102095,
    fbm2: 14166898460303,
    fhexa1: 4410621485967,
    fhx2rf: 14811443232655,
  },
  916: {
    ado1: 7679047146639,
    fbb2: 10814855241359,
    fhx2rf: 14811473453327,
  },
  919: {
    ado1: 8378644511375,
    fbm2: 14169552019087,
  },
  920: {
    fbb2: 10722024534543,
    fbm2: 14066666269839,
    fhx2rf: 14811427426703,
  },
  921: {
    fbb2: 11765374880399,
    fbm2: 13025888432015,
    fhx2rf: 14811426753551,
  },
  922: {
    common: 11765461025679, // Use fbb2 as default
    fbb2: 11765461025679,
    fhx2rf: 14811454916367,
  },
  923: {
    fbb2: 11898806284815,
    fhx2rf: 14811453240591,
  },
  924: {
    fbm2: 14066410187151,
  },
  925: {
    fbm2: 13787396460815,
  },
  926: {
    fbm2: 14066695305999,
  },
  927: {
    fbm2: 14068134886543,
  },
  928: {
    fbm2: 14068122850703,
  },
  929: {
    fbm2: 14289792455823,
  },
  930: {
    fbm2: 14289852209423,
  },
  931: {
    fbm2: 14290352974735,
  },
};

// Some articles are given article ids but not public yet, don't show them
const MISSING_TRANSLATIONS = {
  _test: new Set([-123]), // For testing
  'en-us': new Set([
    14811531232911, 14166906026127, 14108393763471, 14166890705295, 14811500990863, 14166909036687, 14811484479247,
    14166938370447, 14811444964879, 14166898460303, 14811443232655, 14811473453327, 14169552019087, 14066666269839,
    14811427426703, 13025888432015, 14811426753551, 14811454916367, 11898806284815, 14811453240591, 14066410187151,
    13787396460815, 14066695305999, 14068134886543, 14068122850703, 14289792455823, 14289852209423, 14290352974735,
  ]),
  'zh-tw': new Set([11898806284815, 14289792455823]),
};

type CategoryRef = 'current_device' | 'selected_device' | 'workarea';

export const resolveCategory = (category?: Category, ref?: CategoryRef[]): Category => {
  if (category) return category;

  if (!ref || ref.length === 0) return 'common';

  for (const r of ref) {
    switch (r) {
      case 'current_device': {
        const model = deviceMaster.currentDevice?.info.model;

        if (model) return model;

        break;
      }
      case 'selected_device': {
        const model = TopBarController.getSelectedDevice()?.model;

        if (model) return model;

        break;
      }
      case 'workarea':
        return useDocumentStore.getState().workarea;
    }
  }

  return 'common';
};

export const resolveArticle = (
  articles: Partial<Record<Category, number>> | undefined,
  category: Category[],
  langKey: 'en-us' | 'zh-tw',
): number | undefined => {
  if (!articles) return undefined;

  for (const c of category) {
    const articleId = articles[c];

    if (articleId && !MISSING_TRANSLATIONS[langKey]?.has(articleId)) return articleId;
  }

  return undefined;
};

export const getHelpCenterURL = (
  errorCode: number,
  {
    allowHome,
    lang,
    ...opts
  }: Partial<{
    allowHome: boolean;
    category: Category;
    categoryRef: CategoryRef[];
    lang: string;
  }> = {},
): string | undefined => {
  const langKey = (lang ?? i18n.getActiveLang()) === 'zh-tw' ? 'zh-tw' : 'en-us';
  const category = resolveCategory(opts.category, opts.categoryRef);
  const articleId = resolveArticle(HELP_CENTER_ARTICLES[errorCode], [category, 'common'], langKey);

  if (articleId) return `https://support.flux3dp.com/hc/${langKey}/articles/${articleId}`;
  else if (allowHome) return `https://support.flux3dp.com/hc/${langKey}`;
  else return undefined;
};
