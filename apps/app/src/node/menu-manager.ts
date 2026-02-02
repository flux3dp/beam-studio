import { EventEmitter } from 'events';

import type { MenuItemConstructorOptions } from 'electron';
import { app, ipcMain, Menu, MenuItem, shell } from 'electron';
import { funnel } from 'remeda';

import {
  adorModels,
  fcodeV2Models,
  hexaRfModels,
  modelsWithModules,
  promarkModels,
} from '@core/app/actions/beambox/constant';
import { AuthEvents, MenuEvents, MiscEvents } from '@core/app/constants/ipcEvents';
import versionChecker from '@core/helpers/version-checker';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import i18n from './helpers/i18n';
import { getFocusedView } from './helpers/tabHelper';
import type { MenuData } from './interfaces/Menu';
import { buildFileMenu, updateRecentMenu } from './menu/fileMenu';

let r = i18n.lang.topbar.menu;
let accountInfo: null | { email: string } = null;

function buildOSXAppMenu(callback: (data: MenuData) => void) {
  const currentChannel = app.getVersion().split('-')[1] || 'latest';
  const switchChannelLabel = currentChannel === 'latest' ? r.switch_to_beta : r.switch_to_latest;

  return {
    label: 'Beam Studio',
    submenu: [
      { click: callback, id: 'ABOUT_BEAM_STUDIO', label: r.about },
      { click: callback, id: 'SWITCH_VERSION', label: switchChannelLabel },
      {
        accelerator: 'Cmd+,',
        click: callback,
        id: 'PREFERENCE',
        label: r.preferences,
      },
      { type: 'separator' },
      { label: r.service, role: 'services', submenu: [] },
      { type: 'separator' },
      { label: r.hide, role: 'hide' },
      { label: r.hideothers, role: 'hideothers' },
      { type: 'separator' },
      {
        accelerator: 'Cmd+R',
        click: () => {
          getFocusedView()?.webContents.reload();
          Menu.setApplicationMenu(Menu.getApplicationMenu());
        },
        id: 'RELOAD_APP',
        label: r.reload_app,
      },
      { label: r.quit, role: 'quit' },
    ],
  };
}

function buildAccountMenuItems(callback: (data: MenuData) => void, accInfo: null | { email: string }) {
  const signoutLabel = accInfo ? `${r.logout} (${accInfo.email})` : r.logout;

  return [
    {
      click: callback,
      id: 'SIGN_IN',
      label: r.login_or_register,
      visible: !accInfo,
    },
    {
      click: callback,
      id: 'SIGN_OUT',
      label: signoutLabel,
      visible: !!accInfo,
    },
    {
      click: callback,
      enabled: !!accInfo,
      id: 'MANAGE_ACCOUNT',
      label: r.manage_account,
    },
    {
      click() {
        shell.openExternal(r.link.design_market);
      },
      id: 'DESIGN_MARKET',
      label: r.design_market,
    },
  ];
}

function getDeviceMenuId(uuid: string, data: { source: string }): string {
  return `device:${data.source}:${uuid}`;
}

function buildDeviceMenu(callback: (data: MenuData) => void, uuid: string, data: IDeviceInfo, isDevMode = false) {
  const { model, name, serial, source, version } = data;

  const menuLabel = source === 'lan' ? name : `${name} (USB)`;
  const machineName = name;
  const hasModules = modelsWithModules.has(model);
  const isAdor = adorModels.has(model);
  const isPromark = promarkModels.has(model);
  const isBeamo = model === 'fbm1';
  const isBeamo2 = model === 'fbm2';
  const isBb2 = model === 'fbb2';
  const isHexa2 = hexaRfModels.has(model);
  const vc = versionChecker(version);
  const handleClick = (item: MenuItem) => callback({ ...item, machineName, serial, source, uuid });
  const submenu = [
    { click: handleClick, id: 'DASHBOARD', label: r.dashboard },
    { click: handleClick, id: 'MACHINE_INFO', label: r.machine_info },
    isPromark && {
      click: handleClick,
      id: 'PROMARK_SETTINGS',
      label: i18n.lang.promark_settings?.title,
    },
    isPromark && {
      click: handleClick,
      id: 'Z_AXIS_ADJUSTMENT',
      label: i18n.lang.promark_settings?.z_axis_adjustment.title,
    },
    isPromark && {
      click: handleClick,
      id: 'CONNECTION_TEST',
      label: i18n.lang.promark_connection_test.title,
    },
    { type: 'separator' },
    {
      id: 'CALIBRATION',
      label: r.calibration,
      submenu: [
        { click: handleClick, id: 'CALIBRATE_BEAMBOX_CAMERA', label: r.calibrate_beambox_camera },
        (isBb2 || isBeamo2 || isHexa2) && {
          click: handleClick,
          id: 'CALIBRATE_CAMERA_ADVANCED',
          label: r.calibrate_camera_advanced,
        },
        ((isBb2 && (vc.meetRequirement('BB2_WIDE_ANGLE_CAMERA') || isDevMode)) || isHexa2) && {
          click: handleClick,
          id: 'CALIBRATE_CAMERA_WIDE_ANGLE',
          label: r.calibrate_wide_angle_camera,
        },
        isBeamo && {
          click: handleClick,
          id: 'CALIBRATE_BEAMBOX_CAMERA_BORDERLESS',
          label: r.calibrate_beambox_camera_borderless,
        },
        isBeamo && {
          click: handleClick,
          id: 'CALIBRATE_DIODE_MODULE',
          label: r.calibrate_diode_module,
        },
        isAdor &&
          isDevMode && {
            click: handleClick,
            id: 'CALIBRATE_CAMERA_V2_FACTORY',
            label: `${r.calibrate_beambox_camera} (Factory)`,
          },
        isAdor && {
          click: handleClick,
          id: 'CALIBRATE_PRINTER_MODULE',
          label: r.calibrate_printer_module,
        },
        isBeamo2 && {
          click: handleClick,
          id: 'CALIBRATE_PRINTER_4C_MODULE',
          label: r.calibrate_printer_module,
        },
        isBeamo2 &&
          isDevMode && {
            click: handleClick,
            id: 'CALIBRATE_UV_WHITE_INK_MODULE',
            label: `${r.calibrate_printer_module} (${i18n.lang.layer_module.uv_white_ink})`,
          },
        isBeamo2 &&
          isDevMode && {
            click: handleClick,
            id: 'CALIBRATE_UV_VARNISH_MODULE',
            label: `${r.calibrate_printer_module} (${i18n.lang.layer_module.uv_varnish})`,
          },
        (isAdor || isBeamo2) && {
          click: handleClick,
          id: 'CALIBRATE_IR_MODULE',
          label: r.calibrate_ir_module,
        },
        hasModules &&
          isDevMode && {
            click: handleClick,
            id: 'CARTRIDGE_CHIP_SETTING',
            label: 'Cartridge Chip Setting',
          },
      ].filter(Boolean),
    },
    !isPromark && { type: 'separator' },
    fcodeV2Models.has(model) && {
      id: 'CAMERA_CALIBRATION_DATA',
      label: r.camera_calibration_data,
      submenu: [
        {
          click: handleClick,
          id: 'UPLOAD_CALIBRATION_DATA',
          label: r.upload_data,
        },
        {
          click: handleClick,
          id: 'DOWNLOAD_CALIBRATION_DATA',
          label: r.download_data,
        },
      ],
    },
    !isPromark && {
      id: 'UPDATE_MACHINE',
      label: r.update_machine,
      submenu: [
        {
          click: handleClick,
          id: 'UPDATE_FIRMWARE',
          label: r.update_firmware,
        },
        {
          click: handleClick,
          id: 'UPDATE_MAINBOARD',
          label: r.update_mainboard,
        },
        isBeamo2 && {
          click: handleClick,
          id: 'UPDATE_PRINTER_BOARD',
          label: r.update_printer_board,
        },
      ].filter(Boolean),
    },
    !isPromark && {
      id: 'DOWNLOAD_LOG',
      label: r.download_log,
      submenu: [
        {
          click: handleClick,
          id: 'LOG_NETWORK',
          label: r.log.network,
        },
        {
          click: handleClick,
          id: 'LOG_HARDWARE',
          label: r.log.hardware,
        },
        {
          click: handleClick,
          id: 'LOG_DISCOVER',
          label: r.log.discover,
        },
        {
          click: handleClick,
          id: 'LOG_USB',
          label: r.log.usb,
        },
        {
          click: handleClick,
          id: 'LOG_USBLIST',
          label: r.log.usblist,
        },
        {
          click: handleClick,
          id: 'LOG_CAMERA',
          label: r.log.camera,
        },
        {
          click: handleClick,
          id: 'LOG_PLAYER',
          label: r.log.player,
        },
        {
          click: handleClick,
          id: 'LOG_ROBOT',
          label: r.log.robot,
        },
      ],
    },
  ].filter(Boolean) as MenuItemConstructorOptions[];

  return new MenuItem({
    id: getDeviceMenuId(uuid, data),
    label: menuLabel,
    submenu,
    visible: true,
  });
}

class MenuManager extends EventEmitter {
  public appmenu: Menu | null = null;
  private deviceMenu?: MenuItem;
  private deviceList: { [uuid: string]: IDeviceInfo };
  private isDevMode: boolean;
  private reconstructMenu: () => void;

  constructor() {
    super();
    this.deviceList = {};
    this.constructMenu();
    this.isDevMode = false;

    const reconstructMenuHandler = funnel(() => this.constructMenu(), {
      minQuietPeriodMs: 300,
      triggerAt: 'end',
    });

    this.reconstructMenu = () => reconstructMenuHandler.call();

    ipcMain.on(MiscEvents.NotifyLanguage, () => {
      i18n.reloadActiveLang();
      r = i18n.lang.topbar.menu;
      this.constructMenu();
    });

    ipcMain.on(MiscEvents.SetDevMode, (_, isDevMode) => {
      const hasChanged = this.isDevMode !== isDevMode;

      this.isDevMode = isDevMode;

      if (hasChanged && this.deviceMenu?.submenu) {
        this.reconstructMenu();
      }
    });

    ipcMain.on(AuthEvents.UpdateAccount, (e, info) => {
      accountInfo = info;
      this.reconstructMenu();
    });
  }

  constructMenu(): void {
    this.appmenu = Menu.buildFromTemplate(this.buildMenuItems(this.onMenuClick));

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
    updateRecentMenu(false);
    this.emit(MenuEvents.NewAppMenu);
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

      this.emit(MenuEvents.MenuClick, eventData, this.appmenu);
    }

    if (process.platform === 'win32') {
      this.reset_custom_electron_titlebar();
    }
  };

  reset_custom_electron_titlebar(): void {
    const view = getFocusedView();

    if (view) {
      view.webContents.send(MenuEvents.UpdateCustomTitlebar);
    }
  }

  appendDevice(uuid: string, data: IDeviceInfo): void {
    const menuId = getDeviceMenuId(uuid, data);

    this.deviceList[menuId] = data;

    if (this.deviceMenu) {
      const instance = buildDeviceMenu(this.onMenuClick, uuid, data, this.isDevMode);

      if (data.source === 'h2h') {
        this.deviceMenu.submenu?.insert(2, instance);
      } else {
        this.deviceMenu.submenu?.append(instance);
      }

      if (this.appmenu) {
        Menu.setApplicationMenu(this.appmenu);
      }
    }
  }

  updateDevice(uuid: string, data: IDeviceInfo): boolean {
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

  removeDevice(uuid: string, data: IDeviceInfo): void {
    const menuId = getDeviceMenuId(uuid, data);

    delete this.deviceList[menuId];

    if (this.deviceMenu?.submenu) {
      const newMenu = Menu.buildFromTemplate([]);

      this.deviceMenu.submenu.items.forEach((item) => {
        if (item.id !== menuId) {
          newMenu.append(item);
        }
      });
      delete this.deviceMenu.submenu;
      this.deviceMenu.submenu = newMenu;

      if (this.appmenu) {
        this.appmenu = Menu.buildFromTemplate(this.appmenu.items);
      }

      Menu.setApplicationMenu(this.appmenu);
    }
  }

  private buildMenuItems(callback: (data: MenuData) => void): MenuItemConstructorOptions[] {
    const menuItems = [];
    const fnKey = process.platform === 'darwin' ? 'Cmd' : 'Ctrl';
    const deleteKey = 'Delete';

    if (process.platform === 'darwin') {
      menuItems.push(buildOSXAppMenu(callback));
    }

    menuItems.push(buildFileMenu(fnKey, r, callback, this.isDevMode));
    menuItems.push({
      id: '_edit',
      label: r.edit,
      submenu: [
        {
          accelerator: `${fnKey}+Z`,
          click: callback,
          enabled: false,
          id: 'UNDO',
          label: r.undo || 'Undo',
        },
        {
          accelerator: `${fnKey}+Shift+Z`,
          click: callback,
          enabled: false,
          id: 'REDO',
          label: r.redo || 'Redo',
        },
        { type: 'separator' },
        { id: 'CUT', label: r.cut, role: 'cut' },
        { id: 'COPY', label: r.copy, role: 'copy' },
        { id: 'PASTE', label: r.paste, role: 'paste' },
        {
          accelerator: `${fnKey}+Shift+V`,
          click: callback,
          enabled: false,
          id: 'PASTE_IN_PLACE',
          label: r.paste_in_place,
        },
        {
          accelerator: `${fnKey}+D`,
          click: callback,
          enabled: false,
          id: 'DUPLICATE',
          label: r.duplicate || 'Duplicate',
        },
        {
          accelerator: deleteKey,
          click: callback,
          enabled: false,
          id: 'DELETE',
          label: r.delete || 'Delete',
        },
        { type: 'separator' },
        {
          accelerator: `${fnKey}+G`,
          click: callback,
          enabled: false,
          id: 'GROUP',
          label: r.group || 'Group',
        },
        {
          accelerator: `${fnKey}+Shift+G`,
          click: callback,
          enabled: false,
          id: 'UNGROUP',
          label: r.ungroup || 'Ungroup',
        },
        { type: 'separator' },
        {
          enabled: false,
          id: 'PATH',
          label: r.path,
          submenu: [
            { click: callback, id: 'OFFSET', label: r.offset || 'Offset' },
            {
              click: callback,
              enabled: false,
              id: 'DECOMPOSE_PATH',
              label: r.decompose_path,
            },
          ],
        },
        {
          enabled: false,
          id: 'PHOTO_EDIT',
          label: r.photo_edit || 'Edit Photo',
          submenu: [
            { click: callback, id: 'IMAGE_SHARPEN', label: r.image_sharpen },
            { click: callback, id: 'IMAGE_CROP', label: r.image_crop },
            { click: callback, id: 'IMAGE_INVERT', label: r.image_invert },
            { click: callback, id: 'IMAGE_STAMP', label: i18n.lang.stamp_maker_panel.title },
            { click: callback, id: 'IMAGE_VECTORIZE', label: r.image_vectorize },
            { click: callback, id: 'IMAGE_CURVE', label: r.image_curve },
          ],
        },
        {
          enabled: false,
          id: 'SVG_EDIT',
          label: r.svg_edit || 'Edit Photo',
          submenu: [
            {
              click: callback,
              id: 'DISASSEMBLE_USE',
              label: r.disassemble_use || 'Disassemble SVG',
            },
          ],
        },
        {
          enabled: false,
          id: 'LAYER',
          label: r.layer_setting,
          submenu: [
            {
              click: callback,
              id: 'LAYER_COLOR_CONFIG',
              label: r.layer_color_config || 'Color Configuration',
            },
          ],
        },
        { type: 'separator' },
        {
          click: callback,
          enabled: false,
          id: 'DOCUMENT_SETTING',
          label: r.document_setting || 'Document Setting',
        },
        { click: callback, enabled: false, id: 'ROTARY_SETUP', label: r.rotary_setup || 'Rotary Setup' },
      ].filter((item) => !!item),
    });

    menuItems.push({
      id: '_view',
      label: r.view,
      submenu: [
        {
          accelerator: process.platform === 'win32' ? 'CmdOrCtrl++' : 'CmdOrCtrl+Plus',
          click: callback,
          enabled: false,
          id: 'ZOOM_IN',
          label: r.zoom_in || 'Zoom In',
        },
        {
          accelerator: `${fnKey}+-`,
          click: callback,
          enabled: false,
          id: 'ZOOM_OUT',
          label: r.zoom_out || 'Zoom Out',
        },
        { click: callback, enabled: false, id: 'FITS_TO_WINDOW', label: r.fit_to_window || 'Fit To Window' },
        {
          click: callback,
          enabled: false,
          id: 'ZOOM_WITH_WINDOW',
          label: r.zoom_with_window || 'Zoom With Window',
          type: 'checkbox',
        },
        { type: 'separator' },
        {
          checked: true,
          click: callback,
          enabled: false,
          id: 'SHOW_GRIDS',
          label: r.show_grids || 'Show Grids',
          type: 'checkbox',
        },
        {
          click: callback,
          enabled: false,
          id: 'SHOW_RULERS',
          label: r.show_rulers,
          type: 'checkbox',
        },
        {
          click: callback,
          enabled: false,
          id: 'SHOW_LAYER_COLOR',
          label: r.show_layer_color || 'Show Layer Color',
          type: 'checkbox',
        },
        {
          click: callback,
          enabled: false,
          id: 'AUTO_ALIGN',
          label: r.auto_align || 'Auto Align',
          type: 'checkbox',
        },
        {
          click: callback,
          enabled: false,
          id: 'ANTI_ALIASING',
          label: r.anti_aliasing,
          type: 'checkbox',
        },
      ],
    });

    menuItems.push({
      id: '_machines',
      label: r.machines || 'Machines',
      submenu: [
        {
          accelerator: `${fnKey}+M`,
          click: callback,
          id: 'ADD_NEW_MACHINE',
          label: r.add_new_machine || 'Add New Machine',
        },
        { click: callback, enabled: false, id: 'NETWORK_TESTING', label: r.network_testing || 'Test Network' },
        { type: 'separator' },
      ],
    });

    menuItems.push({
      id: '_tools',
      label: r.tools.title,
      submenu: [
        {
          click: callback,
          enabled: false,
          id: 'START_CURVE_ENGRAVING_MODE',
          label: i18n.lang.beambox.left_panel.label.curve_engraving.title,
        },
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

    const helpSubmenu = this.buildHelpMenu(callback);

    menuItems.push({
      id: '_help',
      label: r.help || 'Help',
      role: 'help',
      submenu: helpSubmenu,
    });

    return menuItems as MenuItemConstructorOptions[];
  }

  private buildHelpMenu = (callback: (data: MenuData) => void) => {
    const helpSubmenu = [];

    if (process.platform !== 'darwin') {
      helpSubmenu.push({ click: callback, id: 'ABOUT_BEAM_STUDIO', label: r.about_beam_studio });
    }

    helpSubmenu.push(
      ...[
        { click: callback, enabled: false, id: 'START_TUTORIAL', label: r.show_start_tutorial },
        { click: callback, enabled: false, id: 'START_UI_INTRO', label: r.show_ui_intro },
        { click: callback, id: 'CHANGE_LOGS', label: r.change_logs },
        {
          click() {
            shell.openExternal(r.link.help_center);
          },
          id: 'HELP_CENTER',
          label: r.help_center,
        },
        {
          click() {
            shell.openExternal(r.link.shortcuts);
          },
          id: 'KEYBOARD_SHORTCUTS',
          label: r.keyboard_shortcuts,
        },
        {
          click() {
            shell.openExternal(r.link.contact_us);
          },
          id: 'CONTACT_US',
          label: r.contact,
        },
        { type: 'separator' },
        {
          click() {
            shell.openExternal(r.link.forum);
          },
          id: 'FORUM',
          label: r.forum,
        },
        {
          click: callback,
          id: 'FOLLOW_US',
          label: r.follow_us,
        },
        { type: 'separator' },
      ],
    );
    helpSubmenu.push({ click: callback, id: 'UPDATE_BS', label: r.update });

    if (process.platform !== 'darwin') {
      const currentChannel = app.getVersion().split('-')[1] || 'latest';
      const switchChannelLabel = currentChannel === 'latest' ? r.switch_to_beta : r.switch_to_latest;

      helpSubmenu.push({ click: callback, id: 'SWITCH_VERSION', label: switchChannelLabel });
    }

    helpSubmenu.push(
      ...[
        { type: 'separator' },
        { click: callback, id: 'BUG_REPORT', label: r.bug_report || 'Bug Report' },
        {
          accelerator: process.platform === 'darwin' ? 'Cmd+Option+J' : 'Ctrl+Shift+J',
          click: () => {
            const view = getFocusedView();

            if (view) {
              view.webContents.openDevTools();
            }
          },
          id: 'DEV_TOOL',
          label: r.dev_tool || 'Debug Tool',
        },
        {
          click() {
            shell.openExternal(r.link.beam_studio_api);
          },
          id: 'BEAM_STUDIO_API',
          label: r.using_beam_studio_api || 'Using Beam Studio API',
        },
      ],
    );

    return helpSubmenu;
  };
}

export default MenuManager;
