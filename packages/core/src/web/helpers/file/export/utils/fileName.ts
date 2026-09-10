import currentFileManager from '@core/app/svgedit/currentFileManager';
import i18n from '@core/helpers/i18n';

/**
 * The name to offer in a save dialog. Slashes become colons: a scene name is not a path.
 *
 * Kept out of `utils/common` because `currentFileManager` reaches the auto-save and tab machinery,
 * and through it the dialog components. `common` holds canvas helpers that the export presets load
 * on every target, and they should not drag any of that along.
 */
export const getDefaultFileName = (): string =>
  (currentFileManager.getName() || i18n.lang.topbar.untitled).replace('/', ':');

export default getDefaultFileName;
