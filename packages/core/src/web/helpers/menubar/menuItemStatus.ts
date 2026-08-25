const FILE_MENU_ITEMS = [
  'CLEAR_SCENE',
  'OPEN',
  'RECENT',
  'SHOW_MY_CLOUD',
  'SAVE_AS',
  'SAVE_SCENE',
  'SAVE_TO_CLOUD',
  'SAMPLES',
  'EXPORT_TO',
] as const;
const EDIT_MENU_ITEMS = [
  'UNDO',
  'REDO',
  // 'CUT',
  // 'COPY',
  // 'PASTE',
  'PASTE_IN_PLACE',
  'DUPLICATE',
  'DELETE',
  'GROUP',
  'UNGROUP',
  'PATH',
  'PHOTO_EDIT',
  'SVG_EDIT',
  'LAYER',
  'DOCUMENT_SETTING',
  'ROTARY_SETUP',
] as const;
const VIEW_MENU_ITEMS = [
  'ZOOM_IN',
  'ZOOM_OUT',
  'FITS_TO_WINDOW',
  'ZOOM_WITH_WINDOW',
  'SHOW_GRIDS',
  'SHOW_RULERS',
  'SHOW_LAYER_COLOR',
  'AUTO_ALIGN',
  'ANTI_ALIASING',
] as const;

const DOCKABLE_MENU_ITEMS = [
  // window
  'SHOW_LAYER_CONTROLS_PANEL',
  'SHOW_OBJECT_CONTROLS_PANEL',
  'SHOW_PATH_CONTROLS_PANEL',
  'RESET_LAYOUT',
] as const;

const TOOLS_MENU_ITEMS = ['START_CURVE_ENGRAVING_MODE', 'PRINT_AND_CUT'] as const;
const EDITOR_REQUIRED_DEVICE_ITEMS = ['CALIBRATION'] as const;

/**
 * Special menu items that should be disabled in certain pages
 *
 * Set `enabled: false` in electron menu and update them by attach/detach
 *
 * `enabled` in first-layer submenu won't take effect in Windows; list all items in the submenu
 */
export const MENU_ITEMS = [
  ...FILE_MENU_ITEMS,
  ...EDIT_MENU_ITEMS,
  ...VIEW_MENU_ITEMS,
  ...TOOLS_MENU_ITEMS,
  ...DOCKABLE_MENU_ITEMS,
  ...EDITOR_REQUIRED_DEVICE_ITEMS,
  'NETWORK_TESTING',
  // _help
  'START_TUTORIAL',
  'START_UI_INTRO',
] as const;

export type MenuItemId = (typeof MENU_ITEMS)[number];

/**
 * Menu items that are rendered as disabled before anything enables them, mirroring the
 * `enabled: false` entries of the electron menu template (apps/app/src/node/menu-manager.ts and
 * apps/app/src/node/menu/fileMenu.ts). Used as the initial state of the web menu.
 *
 * `DECOMPOSE_PATH` is not part of `MENU_ITEMS` because attach/detach never touches it (it is
 * toggled by selection only), but it does start disabled in the electron template.
 */
export const INITIALLY_DISABLED_MENU_ITEMS: string[] = [...MENU_ITEMS, 'DECOMPOSE_PATH'];
