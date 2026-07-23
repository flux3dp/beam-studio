import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import i18n from '@core/helpers/i18n';

/**
 * Help Center article id per model. This map doubles as the registry of which models have
 * a maintenance checklist — a model absent here has no schedule. The locale segment is
 * applied at URL-build time.
 */
const helpArticleByModel: Partial<Record<WorkAreaModel, string>> = {
  ado1: '9601243693711',
  fbb1b: '11992267769743',
  fbb1p: '11992267769743',
  fbb2: '11161950590351',
  fbm1: '4405229646479',
  fbm2: '13258917875087',
  fhexa1: '4410372312591',
  fhx2rf: '14811397152527',
  fpm1: '11335687839759',
};

/** Every model that has a maintenance schedule. */
export const ALL_SCHEDULED_MODELS = Object.keys(helpArticleByModel) as WorkAreaModel[];

/** The Help Center article id for a model's overall maintenance guide, or undefined when none. */
export const getMaintenanceArticleId = (model: WorkAreaModel): string | undefined => helpArticleByModel[model];

/**
 * Localized Help Center URL for an article id. Uses the FLUX support locale convention
 * (`zh-tw` for Traditional Chinese, else `en-us`).
 */
export const buildHelpUrl = (articleId: string, lang?: string): string => {
  const langKey = (lang ?? i18n.getActiveLang()) === 'zh-tw' ? 'zh-tw' : 'en-us';

  return `https://support.flux3dp.com/hc/${langKey}/articles/${articleId}`;
};

/**
 * Localized Help Center URL for a model's maintenance article, or undefined when the model
 * has no schedule.
 */
export const getMaintenanceHelpUrl = (model: WorkAreaModel, lang?: string): string | undefined => {
  const articleId = helpArticleByModel[model];

  return articleId ? buildHelpUrl(articleId, lang) : undefined;
};
