import currentFileManager from '@core/app/svgedit/currentFileManager';
import i18n from '@core/helpers/i18n';
import symbolMaker from '@core/helpers/symbol-helper/symbolMaker';

export const getDefaultFileName = () => (currentFileManager.getName() || i18n.lang.topbar.untitled).replace('/', ':');

/**
 * Run `fn` with every `use` pointing at its original vector symbol, then switch back.
 *
 * Awaits `fn`: a synchronous wrapper would switch back the moment an async `fn` hit its first
 * await, leaving the rest of it to run against image symbols and their blob urls.
 */
export const switchSymbolWrapper = async <T>(fn: () => Promise<T> | T): Promise<T> => {
  symbolMaker.switchImageSymbolForAll(false);

  try {
    return await fn();
  } finally {
    symbolMaker.switchImageSymbolForAll(true);
  }
};
