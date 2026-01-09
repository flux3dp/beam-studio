import type { MenuItemConstructorOptions } from 'electron';
import { ipcMain, Menu, MenuItem } from 'electron';
import ElectronStore from 'electron-store';

import { TabEvents } from '@core/app/constants/tabConstants';
import type { ILang } from '@core/interfaces/ILang';

import i18n from '../helpers/i18n';
import { getFocusedView, getTabManager } from '../helpers/tabHelper';
import type { MenuData } from '../interfaces/Menu';

type FileMenu = {
  id: string;
  label: string;
  submenu: MenuItemConstructorOptions[];
};

export function buildFileMenu(
  fnKey: 'Cmd' | 'Ctrl',
  r: ILang['topbar']['menu'],
  callback: (_data: MenuData) => void,
  _isDevMode: boolean = false,
): FileMenu {
  const menuItems: MenuItemConstructorOptions[] = [
    {
      accelerator: `${fnKey}+N`,
      click: callback,
      enabled: false,
      id: 'CLEAR_SCENE',
      label: r.clear_scene || 'Clear Scene',
    },
    {
      accelerator: `${fnKey}+O`,
      click: callback,
      enabled: false,
      id: 'OPEN',
      label: r.open || 'Open',
    },
    { enabled: false, id: 'RECENT', label: r.recent || 'Open Recent', submenu: [] },
    {
      click: callback,
      enabled: false,
      id: 'SHOW_MY_CLOUD',
      label: i18n.lang.beambox.left_panel.label.my_cloud,
    },
    { type: 'separator' },
    {
      accelerator: `${fnKey}+S`,
      click: callback,
      enabled: false,
      id: 'SAVE_SCENE',
      label: r.save_scene || 'Save Scene',
    },
    {
      accelerator: `Shift+${fnKey}+S`,
      click: callback,
      enabled: false,
      id: 'SAVE_AS',
      label: r.save_as,
    },
    {
      click: callback,
      enabled: false,
      id: 'SAVE_TO_CLOUD',
      label: r.save_to_cloud,
    },
    // hidden items for shortcuts
    {
      accelerator: 'CmdOrCtrl+T',
      click: () => getTabManager()?.addNewTab(),
      id: 'NEW_TAB',
      label: 'New Tab',
      visible: false,
    },
    {
      accelerator: 'CmdOrCtrl+W',
      click: () => getTabManager()?.closeFocusedTab({ allowEmpty: true, shouldCloseWindow: true }),
      id: 'CLOSE_TAB',
      label: 'Close Tab',
      visible: false,
    },
    { type: 'separator' },
    {
      enabled: false,
      id: 'SAMPLES',
      label: r.samples || 'Examples',
      submenu: [
        {
          id: 'EXAMPLE_FILES',
          label: r.example_files || 'Example Files',
          submenu: [
            { click: callback, id: 'IMPORT_EXAMPLE_ADOR_LASER', label: r.import_ador_laser_example },
            { click: callback, id: 'IMPORT_EXAMPLE_ADOR_PRINT_SINGLE', label: r.import_ador_printing_example_single },
            { click: callback, id: 'IMPORT_EXAMPLE_ADOR_PRINT_FULL', label: r.import_ador_printing_example_full },
            { click: callback, id: 'IMPORT_EXAMPLE', label: r.import_hello_beamo },
            { click: callback, id: 'IMPORT_EXAMPLE_BEAMO_2_LASER', label: r.import_beamo_2_laser_example },
            { click: callback, id: 'IMPORT_EXAMPLE_BEAMO_2_PRINT', label: r.import_beamo_2_printing_example },
            { click: callback, id: 'IMPORT_HELLO_BEAMBOX', label: r.import_hello_beambox },
            { click: callback, id: 'IMPORT_EXAMPLE_BEAMBOX_2', label: r.import_beambox_2_example },
            { click: callback, id: 'IMPORT_EXAMPLE_HEXA', label: r.import_hexa_example },
            { click: callback, id: 'IMPORT_EXAMPLE_HEXA_RF', label: r.import_hexa_rf_example },
            { click: callback, id: 'IMPORT_EXAMPLE_PROMARK', label: r.import_promark_example },
          ],
        },
        {
          id: 'MATERIAL_TEST',
          label: r.material_test || 'Material Test',
          submenu: [
            { click: callback, id: 'IMPORT_MATERIAL_TESTING_ENGRAVE', label: r.import_material_testing_engrave },
            { click: callback, id: 'IMPORT_MATERIAL_TESTING_OLD', label: r.import_material_testing_old },
            { click: callback, id: 'IMPORT_MATERIAL_TESTING_CUT', label: r.import_material_testing_cut },
            { click: callback, id: 'IMPORT_MATERIAL_TESTING_SIMPLECUT', label: r.import_material_testing_simple_cut },
            { click: callback, id: 'IMPORT_MATERIAL_TESTING_LINE', label: r.import_material_testing_line },
            { click: callback, id: 'IMPORT_MATERIAL_TESTING_PRINT', label: r.import_material_printing_test },
          ],
        },
        {
          id: 'PROMARK_COLOR_TEST',
          label: r.promark_color_test,
          submenu: [
            { click: callback, id: 'IMPORT_EXAMPLE_PROMARK_MOPA_20W_COLOR', label: r.import_promark_mopa_20w_color },
            { click: callback, id: 'IMPORT_EXAMPLE_PROMARK_MOPA_60W_COLOR', label: r.import_promark_mopa_60w_color },
            {
              click: callback,
              id: 'IMPORT_EXAMPLE_PROMARK_MOPA_60W_COLOR_2',
              label: `${r.import_promark_mopa_60w_color} - 2`,
            },
            { click: callback, id: 'IMPORT_EXAMPLE_PROMARK_MOPA_100W_COLOR', label: r.import_promark_mopa_100w_color },
            {
              click: callback,
              id: 'IMPORT_EXAMPLE_PROMARK_MOPA_100W_COLOR_2',
              label: `${r.import_promark_mopa_100w_color} - 2`,
            },
          ],
          type: 'submenu',
        },
        { click: callback, id: 'IMPORT_ACRYLIC_FOCUS_PROBE', label: r.import_acrylic_focus_probe },
        {
          click: callback,
          id: 'IMPORT_BEAMBOX_2_FOCUS_PROBE',
          label: r.import_beambox_2_focus_probe,
        },
      ],
    },
    { type: 'separator' },
    {
      enabled: false,
      id: 'EXPORT_TO',
      label: r.export_to || 'Export to',
      submenu: [
        { click: callback, id: 'EXPORT_BVG', label: 'BVG' },
        { click: callback, id: 'EXPORT_SVG', label: r.export_SVG },
        { click: callback, id: 'EXPORT_PNG', label: 'PNG' },
        { click: callback, id: 'EXPORT_JPG', label: 'JPG' },
        {
          click: callback,
          id: 'EXPORT_UV_PRINT',
          label: r.export_UV_print,
        },
        {
          accelerator: `${fnKey}+E`,
          click: callback,
          id: 'EXPORT_FLUX_TASK',
          label: r.export_flux_task,
        },
      ].filter(Boolean),
    },
  ];

  if (process.platform !== 'darwin') {
    menuItems.push({
      accelerator: `${fnKey}+,`,
      click: callback,
      id: 'PREFERENCE',
      label: r.preferences,
    });
    menuItems.push({
      accelerator: `${fnKey}+R`,
      click: callback,
      id: 'RELOAD_APP',
      label: r.reload_app,
    });
  }

  return { id: '_file', label: r.file, submenu: menuItems };
}

export const updateRecentMenu = (updateWindowMenu = true): void => {
  const recentMenu = Menu.getApplicationMenu()
    ?.items.filter((i) => i.id === '_file')?.[0]
    .submenu?.items.filter((i) => i.id === 'RECENT')?.[0].submenu;

  if (recentMenu) {
    const lang = i18n.lang.topmenu.file;
    const { platform } = process;
    const store = new ElectronStore();
    const recentFiles = (store.get('recent_files') || []) as string[];
    const tabManager = getTabManager();

    if (tabManager) {
      tabManager.sendToView(tabManager.welcomeTabId, TabEvents.UpdateRecentFiles);
    }

    // @ts-expect-error clear is thought to be not existing but actually exist
    recentMenu.clear();
    recentMenu.items = [];
    recentFiles.forEach((filePath) => {
      let label = filePath;

      if (platform !== 'win32') {
        label = filePath.replace(':', '/');
      }

      recentMenu.append(
        new MenuItem({
          click: () => {
            getFocusedView()?.webContents.send('OPEN_RECENT_FILES', filePath);
          },
          id: label,
          label,
        }),
      );
    });
    recentMenu.append(new MenuItem({ type: 'separator' }));
    recentMenu.append(
      new MenuItem({
        click: () => {
          store.set('recent_files', []);
          updateRecentMenu();
        },
        id: 'CLEAR_RECENT',
        label: lang.clear_recent,
      }),
    );
    Menu.setApplicationMenu(Menu.getApplicationMenu());

    if (platform === 'win32' && updateWindowMenu) {
      getFocusedView()?.webContents.send('UPDATE_MENU');
    }
  }
};

ipcMain.on('UPDATE_RECENT_FILES_MENU', () => {
  updateRecentMenu(true);
});

export default {
  buildFileMenu,
  updateRecentMenu,
};
