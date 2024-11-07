/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
import EventEmitter from 'events';

import Store from 'electron-store';
import {
  app,
  BrowserWindow,
  Menu,
  MenuItemConstructorOptions,
  MenuItem,
  shell,
  ipcMain,
} from 'electron';

import DeviceInfo from 'interfaces/DeviceInfo';
import i18n from 'helpers/i18n';
import { adorModels, promarkModels } from 'app/actions/beambox/constant';

import events from './ipc-events';

const store = new Store();
let r = i18n.lang.topbar.menu;
let accountInfo: { email: string } | null = null;

interface MenuData extends MenuItem {
  id: string;
  uuid?: string;
  serial?: string;
  machineName?: string;
  source?: string;
}

function buildOSXAppMenu(callback: (data: MenuData) => void) {
  const currentChannel = app.getVersion().split('-')[1] || 'latest';
  const switchChannelLabel = currentChannel === 'latest' ? r.switch_to_beta : r.switch_to_latest;
  return {
    label: 'Beam Studio',
    submenu: [
      { id: 'ABOUT_BEAM_STUDIO', label: r.about, click: callback },
      { id: 'SWITCH_VERSION', label: switchChannelLabel, click: callback },
      {
        id: 'PREFERENCE',
        label: r.preferences,
        accelerator: 'Cmd+,',
        click: callback,
      },
      { type: 'separator' },
      { label: r.service, role: 'services', submenu: [] },
      { type: 'separator' },
      { label: r.hide, role: 'hide' },
      { label: r.hideothers, role: 'hideothers' },
      { type: 'separator' },
      {
        id: 'RELOAD_APP',
        label: r.reload_app,
        accelerator: 'Cmd+R',
        click: callback,
      },
      { label: r.quit, role: 'quit' },
    ],
  };
}

function buildFileMenu(fnKey: 'Cmd' | 'Ctrl', callback: (data: MenuData) => void) {
  const menuItems = [
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
    // { id: 'TASK_INTERPRETER', label: 'Task Interpreter', click: callback},
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
    { type: 'separator' },
    {
      id: 'SAMPLES',
      label: r.samples || 'Examples',
      submenu: [
        { id: 'IMPORT_EXAMPLE_ADOR_LASER', label: r.import_ador_laser_example, click: callback },
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
        { id: 'IMPORT_EXAMPLE_PROMARK', label: r.import_promark_example, click: callback },
        {
          id: 'IMPORT_MATERIAL_TESTING_ENGRAVE',
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
        { id: 'IMPORT_ACRYLIC_FOCUS_PROBE', label: r.import_acrylic_focus_probe, click: callback },
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

function buildAccountMenuItems(
  callback: (data: MenuData) => void,
  accInfo: { email: string } | null
) {
  const signoutLabel = accInfo ? `${r.sign_out} (${accInfo.email})` : r.sign_out;
  return [
    {
      id: 'SIGN_IN',
      label: r.sign_in,
      click: callback,
      visible: !accInfo,
    },
    {
      id: 'SIGN_OUT',
      label: signoutLabel,
      click: callback,
      visible: !!accInfo,
    },
    {
      id: 'MANAGE_ACCOUNT',
      label: r.manage_account,
      click: callback,
      enabled: !!accInfo,
    },
    {
      id: 'DESIGN_MARKET',
      label: r.design_market,
      click() {
        shell.openExternal(r.link.design_market);
      },
    },
  ];
}

const buildHelpMenu = (callback: (data: MenuData) => void) => {
  const helpSubmenu = [];
  if (process.platform !== 'darwin') {
    helpSubmenu.push({ id: 'ABOUT_BEAM_STUDIO', label: r.about_beam_studio, click: callback });
  }
  helpSubmenu.push(
    ...[
      { id: 'START_TUTORIAL', label: r.show_start_tutorial, click: callback },
      { id: 'START_UI_INTRO', label: r.show_ui_intro, click: callback },
      { id: 'QUESTIONNAIRE', label: r.questionnaire, click: callback },
      { id: 'CHANGE_LOGS', label: r.change_logs, click: callback },
      {
        id: 'HELP_CENTER',
        label: r.help_center,
        click() {
          shell.openExternal(r.link.help_center);
        },
      },
      {
        id: 'KEYBOARD_SHORTCUTS',
        label: r.keyboard_shortcuts,
        click() {
          shell.openExternal(r.link.shortcuts);
        },
      },
      {
        id: 'CONTACT_US',
        label: r.contact,
        click() {
          shell.openExternal(r.link.contact_us);
        },
      },
      { type: 'separator' },
      {
        id: 'FORUM',
        label: r.forum,
        click() {
          shell.openExternal(r.link.forum);
        },
      },
      { type: 'separator' },
    ]
  );
  helpSubmenu.push({ id: 'UPDATE_BS', label: r.update, click: callback });
  if (process.platform !== 'darwin') {
    const currentChannel = app.getVersion().split('-')[1] || 'latest';
    const switchChannelLabel = currentChannel === 'latest' ? r.switch_to_beta : r.switch_to_latest;
    helpSubmenu.push({ id: 'SWITCH_VERSION', label: switchChannelLabel, click: callback });
  }
  helpSubmenu.push(
    ...[
      { type: 'separator' },
      { id: 'BUG_REPORT', label: r.bug_report || 'Bug Report', click: callback },
      {
        id: 'DEV_TOOL',
        label: r.dev_tool || 'Debug Tool',
        click() {
          BrowserWindow.getFocusedWindow()?.webContents.openDevTools();
        },
        accelerator: process.platform === 'darwin' ? 'Cmd+Option+J' : 'Ctrl+Shift+J',
      },
      {
        id: 'BEAM_STUDIO_API',
        label: r.using_beam_studio_api || 'Using Beam Studio API',
        click() {
          shell.openExternal(r.link.beam_studio_api);
        },
      },
    ]
  );
  return helpSubmenu;
};

function buildMenuItems(
  callback: (data: MenuData) => void,
  isDevMode = false
): MenuItemConstructorOptions[] {
  const menuItems = [];
  const fnKey = process.platform === 'darwin' ? 'Cmd' : 'Ctrl';
  const deleteKey = 'Delete';

  if (process.platform === 'darwin') {
    menuItems.push(buildOSXAppMenu(callback));
  }

  menuItems.push(buildFileMenu(fnKey, callback));

  menuItems.push({
    id: '_edit',
    label: r.edit,
    submenu: [
      {
        id: 'UNDO',
        label: r.undo || 'Undo',
        click: callback,
        accelerator: `${fnKey}+Z`,
      },
      {
        id: 'REDO',
        label: r.redo || 'Redo',
        click: callback,
        accelerator: `${fnKey}+Shift+Z`,
      },
      { type: 'separator' },
      { id: 'CUT', label: r.cut, role: 'cut' },
      { id: 'COPY', label: r.copy, role: 'copy' },
      { id: 'PASTE', label: r.paste, role: 'paste' },
      {
        id: 'PASTE_IN_PLACE',
        label: r.paste_in_place,
        click: callback,
        accelerator: `${fnKey}+Shift+V`,
      },
      {
        id: 'DUPLICATE',
        label: r.duplicate || 'Duplicate',
        enabled: false,
        click: callback,
        accelerator: `${fnKey}+D`,
      },
      {
        id: 'DELETE',
        label: r.delete || 'Delete',
        enabled: false,
        click: callback,
        accelerator: deleteKey,
      },
      { type: 'separator' },
      {
        id: 'GROUP',
        label: r.group || 'Group',
        enabled: false,
        click: callback,
        accelerator: `${fnKey}+G`,
      },
      {
        id: 'UNGROUP',
        label: r.ungroup || 'Ungroup',
        enabled: false,
        click: callback,
        accelerator: `${fnKey}+Shift+G`,
      },
      { type: 'separator' },
      {
        id: 'PATH',
        label: r.path,
        enabled: false,
        submenu: [
          { id: 'OFFSET', label: r.offset || 'Offset', click: callback },
          {
            id: 'DECOMPOSE_PATH',
            label: r.decompose_path,
            enabled: false,
            click: callback,
          },
        ],
      },
      {
        id: 'PHOTO_EDIT',
        label: r.photo_edit || 'Edit Photo',
        enabled: false,
        submenu: [
          { id: 'IMAGE_SHARPEN', label: r.image_sharpen, click: callback },
          { id: 'IMAGE_CROP', label: r.image_crop, click: callback },
          { id: 'IMAGE_INVERT', label: r.image_invert, click: callback },
          { id: 'IMAGE_STAMP', label: r.image_stamp, click: callback },
          { id: 'IMAGE_VECTORIZE', label: r.image_vectorize, click: callback },
          { id: 'IMAGE_CURVE', label: r.image_curve, click: callback },
        ],
      },
      {
        id: 'SVG_EDIT',
        label: r.svg_edit || 'Edit Photo',
        enabled: false,
        submenu: [
          { id: 'DISASSEMBLE_USE', label: r.disassemble_use || 'Disassemble SVG', click: callback },
        ],
      },
      {
        id: 'LAYER',
        label: r.layer_setting,
        submenu: [
          {
            id: 'LAYER_COLOR_CONFIG',
            label: r.layer_color_config || 'Color Configuration',
            click: callback,
          },
        ],
      },
      { type: 'separator' },
      { id: 'DOCUMENT_SETTING', label: r.document_setting || 'Document Setting', click: callback },
      { id: 'ROTARY_SETUP', label: r.rotary_setup || 'Rotary Setup', click: callback },
    ].filter((item) => !!item),
  });

  menuItems.push({
    id: '_view',
    label: r.view,
    submenu: [
      {
        id: 'ZOOM_IN',
        label: r.zoom_in || 'Zoom In',
        click: callback,
        accelerator: process.platform === 'win32' ? 'CmdOrCtrl++' : 'CmdOrCtrl+Plus',
      },
      {
        id: 'ZOOM_OUT',
        label: r.zoom_out || 'Zoom Out',
        click: callback,
        accelerator: `${fnKey}+-`,
      },
      { id: 'FITS_TO_WINDOW', label: r.fit_to_window || 'Fit To Window', click: callback },
      {
        id: 'ZOOM_WITH_WINDOW',
        label: r.zoom_with_window || 'Zoom With Window',
        click: callback,
        type: 'checkbox',
      },
      { type: 'separator' },
      {
        id: 'SHOW_GRIDS',
        label: r.show_grids || 'Show Grids',
        click: callback,
        type: 'checkbox',
        checked: true,
      },
      {
        id: 'SHOW_RULERS',
        label: r.show_rulers,
        click: callback,
        type: 'checkbox',
      },
      {
        id: 'SHOW_LAYER_COLOR',
        label: r.show_layer_color || 'Show Layer Color',
        click: callback,
        type: 'checkbox',
      },
      {
        id: 'ALIGN_TO_EDGES',
        label: r.align_to_edges,
        enabled: false,
        click: callback,
        type: 'checkbox',
      },
      {
        id: 'ANTI_ALIASING',
        label: r.anti_aliasing,
        click: callback,
        type: 'checkbox',
      },
    ],
  });

  menuItems.push({
    id: '_machines',
    label: r.machines || 'Machines',
    submenu: [
      {
        id: 'ADD_NEW_MACHINE',
        label: r.add_new_machine || 'Add New Machine',
        accelerator: `${fnKey}+M`,
        click: callback,
      },
      { id: 'NETWORK_TESTING', label: r.network_testing || 'Test Network', click: callback },
      { type: 'separator' },
    ],
  });

  menuItems.push({
    id: '_tools',
    label: r.tools.title,
    submenu: [
      { id: 'MATERIAL_TEST_GENERATOR', label: r.tools.material_test_generator, click: callback },
      { id: 'QR_CODE_GENERATOR', label: r.tools.qr_code_generator, click: callback },
      { id: 'BOX_GEN', label: r.tools.box_generator, click: callback },
    ],
  });

  const accountSubmenu = buildAccountMenuItems(callback, accountInfo);
  menuItems.push({
    id: '_account',
    label: r.account,
    submenu: accountSubmenu,
  });

  if (process.platform === 'darwin') {
    menuItems.push({
      label: r.window,
      role: 'window',
      submenu: [
        { label: r.minimize, role: 'minimize' },
        { label: r.close, role: 'close' },
      ],
    });
  }

  const helpSubmenu = buildHelpMenu(callback);
  menuItems.push({
    id: '_help',
    label: r.help || 'Help',
    role: 'help',
    submenu: helpSubmenu,
  });

  return menuItems as MenuItemConstructorOptions[];
}

function getDeviceMenuId(uuid: string, data: { source: string }): string {
  return `device:${data.source}:${uuid}`;
}

function buildDeviceMenu(
  callback: (data: MenuData) => void,
  uuid: string,
  data: DeviceInfo,
  isDevMode = false
) {
  const { serial, source, name, model } = data;
  const menuLabel = source === 'lan' ? name : `${name} (USB)`;
  const machineName = name;
  const isAdor = adorModels.has(model);
  const isPromark = promarkModels.has(model);
  const isBeamo = model === 'fbm1';
  const handleClick = (item: MenuItem) => callback({ ...item, uuid, serial, machineName, source });
  const submenu: MenuItemConstructorOptions[] = [
    { id: 'DASHBOARD', label: r.dashboard, click: handleClick },
    { id: 'MACHINE_INFO', label: r.machine_info, click: handleClick },
    isPromark
      ? { id: 'PROMARK_SETTINGS', label: i18n.lang.promark_settings?.title, click: handleClick }
      : null,
    { type: 'separator' },
    { id: 'CALIBRATE_BEAMBOX_CAMERA', label: r.calibrate_beambox_camera, click: handleClick },
    isBeamo
      ? {
          id: 'CALIBRATE_BEAMBOX_CAMERA_BORDERLESS',
          label: r.calibrate_beambox_camera_borderless,
          click: handleClick,
        }
      : null,
    isBeamo
      ? {
          id: 'CALIBRATE_DIODE_MODULE',
          label: r.calibrate_diode_module,
          click: handleClick,
        }
      : null,
    isAdor && isDevMode
      ? {
          id: 'CALIBRATE_CAMERA_V2_FACTORY',
          label: `${r.calibrate_beambox_camera} (Factory)`,
          click: handleClick,
        }
      : null,
    isAdor
      ? {
          id: 'CALIBRATE_PRINTER_MODULE',
          label: r.calibrate_printer_module,
          click: handleClick,
        }
      : null,
    isAdor
      ? {
          id: 'CALIBRATE_IR_MODULE',
          label: r.calibrate_ir_module,
          click: handleClick,
        }
      : null,
    isAdor && isDevMode
      ? {
          id: 'CATRIDGE_CHIP_SETTING',
          label: 'Catridge Chip Setting',
          click: handleClick,
        }
      : null,
    { type: 'separator' },
    isAdor
      ? {
          id: 'CAMERA_CALIBRATION_DATA',
          label: r.camera_calibration_data,
          submenu: [
            {
              id: 'UPLOAD_CALIBRATION_DATA',
              label: r.upload_data,
              click: handleClick,
            },
            {
              id: 'DOWNLOAD_CALIBRATION_DATA',
              label: r.download_data,
              click: handleClick,
            },
          ],
        }
      : null,
    {
      id: 'UPDATE_FIRMWARE',
      label: r.update_firmware,
      click: handleClick,
    },
    {
      id: 'DOWNLOAD_LOG',
      label: r.download_log,
      submenu: [
        {
          id: 'LOG_NETWORK',
          label: r.log.network,
          click: handleClick,
        },
        {
          id: 'LOG_HARDWARE',
          label: r.log.hardware,
          click: handleClick,
        },
        {
          id: 'LOG_DISCOVER',
          label: r.log.discover,
          click: handleClick,
        },
        {
          id: 'LOG_USB',
          label: r.log.usb,
          click: handleClick,
        },
        {
          id: 'LOG_USBLIST',
          label: r.log.usblist,
          click: handleClick,
        },
        {
          id: 'LOG_CAMERA',
          label: r.log.camera,
          click: handleClick,
        },
        {
          id: 'LOG_PLAYER',
          label: r.log.player,
          click: handleClick,
        },
        {
          id: 'LOG_ROBOT',
          label: r.log.robot,
          click: handleClick,
        },
      ],
    },
  ].filter(Boolean) as MenuItemConstructorOptions[];

  return new MenuItem({
    label: menuLabel,
    id: getDeviceMenuId(uuid, data),
    visible: true,
    submenu,
  });
}

class MenuManager extends EventEmitter {
  public appmenu: Menu | null = null;

  private deviceMenu?: MenuItem;

  private deviceList: { [uuid: string]: DeviceInfo };

  private isDevMode: boolean;

  constructor() {
    super();
    this.deviceList = {};
    this.constructMenu();
    this.isDevMode = false;

    ipcMain.on(events.NOTIFY_LANGUAGE, () => {
      const language = (store.get('active-lang') as string) || 'en';
      i18n.setActiveLang(language);
      r = i18n.lang.topbar.menu;
      this.constructMenu();
    });

    ipcMain.on(events.DISABLE_MENU_ITEM, (e, ids) => {
      this.toggleMenu(ids, false);
    });

    ipcMain.on(events.ENABLE_MENU_ITEM, (e, ids) => {
      this.toggleMenu(ids, true);
    });

    ipcMain.on('SET_DEV_MODE', (_, isDevMode) => {
      const hasChanged = this.isDevMode !== isDevMode;
      this.isDevMode = isDevMode;
      if (hasChanged && this.deviceMenu?.submenu) {
        this.constructMenu();
      }
    });

    ipcMain.on(events.UPDATE_ACCOUNT, (e, info) => {
      accountInfo = info;
      const item = Menu.getApplicationMenu()?.items.find((i) => i.id === '_account');
      const accountSubmenu = item?.submenu;
      if (accountSubmenu) {
        const newMenu = Menu.buildFromTemplate([]);
        const signoutLabel = info ? `${r.sign_out} (${info.email})` : r.sign_out;
        accountSubmenu.items.forEach((menuitem) => {
          if (menuitem.id === 'SIGN_IN') {
            // eslint-disable-next-line no-param-reassign
            menuitem.visible = !info;
            newMenu.append(menuitem);
          } else if (menuitem.id === 'SIGN_OUT') {
            const newSignOut = new MenuItem({
              id: 'SIGN_OUT',
              visible: !!info,
              click: menuitem.click as () => void,
              label: signoutLabel,
            });
            newMenu.append(newSignOut);
          } else if (menuitem.id === 'MANAGE_ACCOUNT') {
            // eslint-disable-next-line no-param-reassign
            menuitem.enabled = !!info;
            newMenu.append(menuitem);
          } else {
            newMenu.append(menuitem);
          }
        });
        delete item.submenu;
        item.submenu = newMenu;
      }
      Menu.setApplicationMenu(Menu.getApplicationMenu());
    });
  }

  constructMenu(): void {
    this.appmenu = Menu.buildFromTemplate(buildMenuItems(this.onMenuClick, this.isDevMode));

    for (const i in this.appmenu.items) {
      if (this.appmenu.items[i].id === '_machines') {
        this.deviceMenu = this.appmenu.items[i];
      }
    }
    for (const devMenuId in this.deviceList) {
      const data = this.deviceList[devMenuId];
      const instance = buildDeviceMenu(this.onMenuClick, data.uuid, data, this.isDevMode);
      this.deviceMenu?.submenu?.append(instance);
    }
    Menu.setApplicationMenu(this.appmenu);
    this.emit('NEW_APP_MENU');
  }

  toggleMenu(ids: string | string[], enabled: boolean): void {
    const idList = Array.isArray(ids) ? ids : [ids];
    if (!this.appmenu) return;
    const iterStack = [...this.appmenu.items];
    while (iterStack.length > 0) {
      const item = iterStack.pop();
      if (item) {
        if (item.submenu) iterStack.push(...item.submenu.items);
        if (idList.indexOf(item.id) >= 0) item.enabled = enabled;
      }
    }
    Menu.setApplicationMenu(this.appmenu);
  }

  onMenuClick = (data: MenuData): void => {
    if (data.id) {
      const eventData: MenuData = { ...data };
      if (data.uuid && data.source) {
        const menuId = getDeviceMenuId(data.uuid, { source: data.source });
        if (this.deviceList[menuId]) {
          eventData.serial = this.deviceList[menuId].serial;
          eventData.machineName = this.deviceList[menuId].name;
        }
      }
      this.emit(events.MENU_CLICK, eventData, this.appmenu);
    }
    if (process.platform === 'win32') {
      this.reset_custom_electron_titlebar();
    }
  };

  reset_custom_electron_titlebar(): void {
    BrowserWindow.getFocusedWindow()?.webContents.send(events.UPDATE_CUSTOM_TITLEBAR);
  }

  appendDevice(uuid: string, data: DeviceInfo): void {
    const menuId = getDeviceMenuId(uuid, data);
    this.deviceList[menuId] = data;
    if (this.deviceMenu) {
      const instance = buildDeviceMenu(this.onMenuClick, uuid, data, this.isDevMode);

      if (data.source === 'h2h') {
        this.deviceMenu.submenu?.insert(2, instance);
      } else {
        this.deviceMenu.submenu?.append(instance);
      }
      if (this.appmenu) Menu.setApplicationMenu(this.appmenu);
    }
  }

  updateDevice(uuid: string, data: DeviceInfo): boolean {
    const menuId = getDeviceMenuId(uuid, data);
    this.deviceList[menuId] = data;

    if (this.deviceMenu?.submenu) {
      for (const menuitem of this.deviceMenu.submenu.items) {
        if (menuitem.id === menuId) {
          if (menuitem.label !== data.name) {
            menuitem.label = data.name;
            Menu.setApplicationMenu(this.appmenu);
            return true;
          }
          return false;
        }
      }
    }
    this.appendDevice(uuid, data);
    return true;
  }

  removeDevice(uuid: string, data: DeviceInfo): void {
    const menuId = getDeviceMenuId(uuid, data);
    delete this.deviceList[menuId];

    if (this.deviceMenu?.submenu) {
      const newMenu = Menu.buildFromTemplate([]);
      this.deviceMenu.submenu.items.forEach((item) => {
        if (item.id !== menuId) newMenu.append(item);
      });
      delete this.deviceMenu.submenu;
      this.deviceMenu.submenu = newMenu;
      if (this.appmenu) this.appmenu = Menu.buildFromTemplate(this.appmenu.items);
      Menu.setApplicationMenu(this.appmenu);
    }
  }
}

export default MenuManager;
