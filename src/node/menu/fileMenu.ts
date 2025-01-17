import ElectronStore from 'electron-store';
// eslint-disable-next-line import/no-extraneous-dependencies
import { ipcMain, Menu, MenuItem, MenuItemConstructorOptions } from 'electron';

import i18n from 'helpers/i18n';
import { getFocusedView, getTabManager } from 'node/helpers/tabHelper';
import { ILang } from 'interfaces/ILang';
import { MenuData } from 'interfaces/Menu';

export function buildFileMenu(
  fnKey: 'Cmd' | 'Ctrl',
  r: ILang['topbar']['menu'],
  callback: (data: MenuData) => void
): {
  id: string;
  label: string;
  submenu: MenuItemConstructorOptions[];
} {
  const menuItems: MenuItemConstructorOptions[] = [
    {
      id: 'CLEAR_SCENE',
      label: r.clear_scene || 'Clear Scene',
      enabled: false,
      click: callback,
      accelerator: `${fnKey}+N`,
    },
    {
      id: 'OPEN',
      label: r.open || 'Open',
      click: callback,
      accelerator: `${fnKey}+O`,
    },
    { id: 'RECENT', label: r.recent || 'Open Recent', submenu: [] },
    { type: 'separator' },
    {
      id: 'SAVE_SCENE',
      label: r.save_scene || 'Save Scene',
      click: callback,
      accelerator: `${fnKey}+S`,
    },
    {
      id: 'SAVE_AS',
      label: r.save_as,
      click: callback,
      accelerator: `Shift+${fnKey}+S`,
    },
    {
      id: 'SAVE_TO_CLOUD',
      label: r.save_to_cloud,
      click: callback,
    },
    // hidden items for shortcuts
    {
      id: 'NEW_TAB',
      label: 'New Tab',
      accelerator: 'CmdOrCtrl+T',
      visible: false,
      click: () => getTabManager()?.addNewTab(),
    },
    {
      id: 'CLOSE_TAB',
      label: 'Close Tab',
      accelerator: 'CmdOrCtrl+W',
      visible: false,
      click: () => getTabManager()?.closeFocusedTab({ allowEmpty: true, shouldCloseWindow: true }),
    },
    { type: 'separator' },
    {
      id: 'SAMPLES',
      label: r.samples || 'Examples',
      submenu: [
        {
          id: 'EXAMPLE_FILES',
          label: r.example_files || 'Example Files',
          submenu: [
            {
              id: 'IMPORT_EXAMPLE_ADOR_LASER',
              label: r.import_ador_laser_example,
              click: callback,
            },
            {
              id: 'IMPORT_EXAMPLE_ADOR_PRINT_SINGLE',
              label: r.import_ador_printing_example_single,
              click: callback,
            },
            {
              id: 'IMPORT_EXAMPLE_ADOR_PRINT_FULL',
              label: r.import_ador_printing_example_full,
              click: callback,
            },
            { id: 'IMPORT_EXAMPLE', label: r.import_hello_beamo, click: callback },
            { id: 'IMPORT_HELLO_BEAMBOX', label: r.import_hello_beambox, click: callback },
            { id: 'IMPORT_EXAMPLE_BEAMBOX_2', label: r.import_beambox_2_example, click: callback },
            { id: 'IMPORT_EXAMPLE_HEXA', label: r.import_hexa_example, click: callback },
            { id: 'IMPORT_EXAMPLE_PROMARK', label: r.import_promark_example, click: callback },
          ],
        },
        {
          id: 'MATERIAL_TEST',
          label: r.material_test || 'Material Test',
          submenu: [
            {
              id: 'IMPORT_MATERIAL_TESTING_ENGRAVE',
              label: r.import_material_testing_engrave,
              click: callback,
            },
            {
              id: 'IMPORT_MATERIAL_TESTING_ENGRAVE_BEAMBOX_2',
              label: r.import_material_testing_engrave,
              click: callback,
            },
            {
              id: 'IMPORT_MATERIAL_TESTING_OLD',
              label: r.import_material_testing_old,
              click: callback,
            },
            {
              id: 'IMPORT_MATERIAL_TESTING_CUT',
              label: r.import_material_testing_cut,
              click: callback,
            },
            {
              id: 'IMPORT_MATERIAL_TESTING_CUT_BEAMBOX_2',
              label: r.import_material_testing_cut,
              click: callback,
            },
            {
              id: 'IMPORT_MATERIAL_TESTING_SIMPLECUT',
              label: r.import_material_testing_simple_cut,
              click: callback,
            },
            {
              id: 'IMPORT_MATERIAL_TESTING_LINE',
              label: r.import_material_testing_line,
              click: callback,
            },
            {
              id: 'IMPORT_MATERIAL_TESTING_PRINT',
              label: r.import_material_printing_test,
              click: callback,
            },
          ],
        },
        {
          id: 'PROMARK_COLOR_TEST',
          label: r.promark_color_test,
          type: 'submenu',
          submenu: [
            {
              id: 'IMPORT_EXAMPLE_PROMARK_MOPA_20W_COLOR',
              label: r.import_promark_mopa_20w_color,
              click: callback,
            },
            {
              id: 'IMPORT_EXAMPLE_PROMARK_MOPA_60W_COLOR',
              label: r.import_promark_mopa_60w_color,
              click: callback,
            },
            {
              id: 'IMPORT_EXAMPLE_PROMARK_MOPA_60W_COLOR_2',
              label: `${r.import_promark_mopa_60w_color} - 2`,
              click: callback,
            },
            {
              id: 'IMPORT_EXAMPLE_PROMARK_MOPA_100W_COLOR',
              label: r.import_promark_mopa_100w_color,
              click: callback,
            },
            {
              id: 'IMPORT_EXAMPLE_PROMARK_MOPA_100W_COLOR_2',
              label: `${r.import_promark_mopa_100w_color} - 2`,
              click: callback,
            },
          ],
        },
        { id: 'IMPORT_ACRYLIC_FOCUS_PROBE', label: r.import_acrylic_focus_probe, click: callback },
        {
          id: 'IMPORT_BEAMBOX_2_FOCUS_PROBE',
          label: r.import_beambox_2_focus_probe,
          click: callback,
        },
      ],
    },
    { type: 'separator' },
    {
      id: 'EXPORT_TO',
      label: r.export_to || 'Export to',
      submenu: [
        { id: 'EXPORT_BVG', label: 'BVG', click: callback },
        { id: 'EXPORT_SVG', label: r.export_SVG, click: callback },
        { id: 'EXPORT_PNG', label: 'PNG', click: callback },
        { id: 'EXPORT_JPG', label: 'JPG', click: callback },
        {
          id: 'EXPORT_FLUX_TASK',
          label: r.export_flux_task,
          click: callback,
          accelerator: `${fnKey}+E`,
        },
      ],
    },
  ];

  if (process.platform !== 'darwin') {
    menuItems.push({
      id: 'PREFERENCE',
      label: r.preferences,
      accelerator: `${fnKey}+,`,
      click: callback,
    });
    menuItems.push({
      id: 'RELOAD_APP',
      label: r.reload_app,
      accelerator: `${fnKey}+R`,
      click: callback,
    });
  }

  return {
    id: '_file',
    label: r.file,
    submenu: menuItems,
  };
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
          id: label,
          label,
          click: () => {
            getFocusedView()?.webContents.send('OPEN_RECENT_FILES', filePath);
          },
        })
      );
    });
    recentMenu.append(new MenuItem({ type: 'separator' }));
    recentMenu.append(
      new MenuItem({
        id: 'CLEAR_RECENT',
        label: lang.clear_recent,
        click: () => {
          store.set('recent_files', []);
          updateRecentMenu();
        },
      })
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
