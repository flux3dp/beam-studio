/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
const EventEmitter = require('events');
const {
  app,
  BrowserWindow,
  Menu,
  MenuItem,
  shell,
  ipcMain,
} = require('electron');
const Store = require('electron-store');
const resource = require('./menu-resource');
const events = require('./ipc-events');

const store = new Store();
let r = resource.en;
let accountInfo = null;

function buildOSXAppMenu(callback) {
  const currentChannel = app.getVersion().split('-')[1] || 'latest';
  const switchChannelLabel = currentChannel === 'latest' ? r.switch_to_beta : r.switch_to_latest;
  return {
    label: 'Beam Studio',
    submenu: [
      { id: 'ABOUT_BEAM_STUDIO', label: r.about, click: callback },
      { id: 'SWITCH_VERSION', label: switchChannelLabel, click: callback },
      {
        id: 'PREFERENCE', label: r.preferences, accelerator: 'Cmd+,', click: callback,
      },
      { type: 'separator' },
      { label: r.service, role: 'services', submenu: [] },
      { type: 'separator' },
      { label: r.hide, role: 'hide' },
      { label: r.hideothers, role: 'hideothers' },
      { type: 'separator' },
      {
        id: 'RELOAD_APP', label: r.reload_app, accelerator: 'Cmd+R', click: callback,
      },
      { label: r.quit, role: 'quit' },
    ],
  };
}

function buildFileMenu(fnKey, callback) {
  const menuItems = [
    {
      id: 'CLEAR_SCENE', label: r.clear_scene || 'Clear Scene', enabled: false, click: callback, accelerator: `${fnKey}+N`,
    },
    {
      id: 'OPEN', label: r.open || 'Open', click: callback, accelerator: `${fnKey}+O`,
    },
    { id: 'RECENT', label: r.recent || 'Open Recent', submenu: [] },
    // { id: 'TASK_INTERPRETER', label: 'Task Interpreter', click: callback},
    { type: 'separator' },
    {
      id: 'SAVE_SCENE', label: r.save_scene || 'Save Scene', click: callback, accelerator: `${fnKey}+S`,
    },
    {
      id: 'SAVE_AS', label: r.save_as, click: callback, accelerator: `Shift+${fnKey}+S`,
    },
    {
      id: 'SAVE_TO_CLOUD', label: r.save_to_cloud, click: callback,
    },
    { type: 'separator' },
    {
      id: 'SAMPLES',
      label: r.samples || 'Examples',
      submenu: [
        { id: 'IMPORT_EXAMPLE_ADOR_LASER', label: r.import_ador_laser_example, click: callback },
        { id: 'IMPORT_EXAMPLE_ADOR_PRINT_SINGLE', label: r.import_ador_printing_example_single, click: callback },
        { id: 'IMPORT_EXAMPLE_ADOR_PRINT_FULL', label: r.import_ador_printing_example_full, click: callback },
        { id: 'IMPORT_EXAMPLE', label: r.import_hello_beamo, click: callback },
        { id: 'IMPORT_HELLO_BEAMBOX', label: r.import_hello_beambox, click: callback },
        { id: 'IMPORT_MATERIAL_TESTING_ENGRAVE', label: r.import_material_testing_engrave, click: callback },
        { id: 'IMPORT_MATERIAL_TESTING_OLD', label: r.import_material_testing_old, click: callback },
        { id: 'IMPORT_MATERIAL_TESTING_CUT', label: r.import_material_testing_cut, click: callback },
        { id: 'IMPORT_MATERIAL_TESTING_SIMPLECUT', label: r.import_material_testing_simple_cut, click: callback },
        { id: 'IMPORT_MATERIAL_TESTING_LINE', label: r.import_material_testing_line, click: callback },
        { id: 'IMPORT_MATERIAL_TESTING_PRINT', label: r.import_material_printing_test, click: callback },
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
          id: 'EXPORT_FLUX_TASK', label: r.export_flux_task, click: callback, accelerator: `${fnKey}+E`,
        },
      ],
    },
  ];

  if (process.platform !== 'darwin') {
    menuItems.push({
      id: 'PREFERENCE', label: r.preferences, accelerator: `${fnKey}+,`, click: callback,
    });
    menuItems.push({
      id: 'RELOAD_APP', label: r.reload_app, accelerator: `${fnKey}+R`, click: callback,
    });
  }

  return {
    id: '_file',
    label: r.file,
    submenu: menuItems,
  };
}

function buildAccountMenuItems(callback, accInfo) {
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

const buildHelpMenu = (callback) => {
  const helpSubmenu = [];
  if (process.platform !== 'darwin') {
    helpSubmenu.push({ id: 'ABOUT_BEAM_STUDIO', label: r.about_beam_studio, click: callback });
  }
  helpSubmenu.push(...[
    { id: 'START_TUTORIAL', label: r.show_start_tutorial, click: callback },
    { id: 'START_UI_INTRO', label: r.show_ui_intro, click: callback },
    { id: 'QUESTIONNAIRE', label: r.questionnaire, click: callback },
    { id: 'CHANGE_LOGS', label: r.change_logs, click: callback },
    { id: 'HELP_CENTER', label: r.help_center, click() { shell.openExternal(r.link.help_center); } },
    { id: 'KEYBOARD_SHORTCUTS', label: r.keyboard_shortcuts, click() { shell.openExternal(r.link.shortcuts); } },
    { id: 'CONTACT_US', label: r.contact, click() { shell.openExternal(r.link.contact_us); } },
    { type: 'separator' },
    { id: 'FORUM', label: r.forum, click() { shell.openExternal(r.link.forum); } },
    { type: 'separator' },
  ]);
  helpSubmenu.push({ id: 'UPDATE_BS', label: r.update, click: callback });
  if (process.platform !== 'darwin') {
    const currentChannel = app.getVersion().split('-')[1] || 'latest';
    const switchChannelLabel = currentChannel === 'latest' ? r.switch_to_beta : r.switch_to_latest;
    helpSubmenu.push({ id: 'SWITCH_VERSION', label: switchChannelLabel, click: callback });
  }
  helpSubmenu.push(...[
    { type: 'separator' },
    { id: 'BUG_REPORT', label: r.bug_report || 'Bug Report', click: callback },
    {
      id: 'DEV_TOOL', label: r.dev_tool || 'Debug Tool', click() { BrowserWindow.getFocusedWindow().webContents.openDevTools(); }, accelerator: process.platform === 'darwin' ? 'Cmd+Option+J' : 'Ctrl+Shift+J',
    },
    {
      id: 'BEAM_STUDIO_API', label: r.using_beam_studio_api || 'Using Beam Studio API', click() { shell.openExternal(r.link.beam_studio_api); },
    },
  ]);
  return helpSubmenu;
};

function buildMenuItems(callback) {
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
        id: 'UNDO', label: r.undo || 'Undo', click: callback, accelerator: `${fnKey}+Z`,
      },
      {
        id: 'REDO', label: r.redo || 'Redo', click: callback, accelerator: `${fnKey}+Shift+Z`,
      },
      { type: 'separator' },
      { id: 'CUT', label: r.cut, role: 'cut' },
      { id: 'COPY', label: r.copy, role: 'copy' },
      { id: 'PASTE', label: r.paste, role: 'paste' },
      {
        id: 'PASTE_IN_PLACE', label: r.paste_in_place, click: callback, accelerator: `${fnKey}+Shift+V`,
      },
      {
        id: 'DUPLICATE', label: r.duplicate || 'Duplicate', enabled: false, click: callback, accelerator: `${fnKey}+D`,
      },
      {
        id: 'DELETE', label: r.delete || 'Delete', enabled: false, click: callback, accelerator: deleteKey,
      },
      { type: 'separator' },
      {
        id: 'GROUP', label: r.group || 'Group', enabled: false, click: callback, accelerator: `${fnKey}+G`,
      },
      {
        id: 'UNGROUP', label: r.ungroup || 'Ungroup', enabled: false, click: callback, accelerator: `${fnKey}+Shift+G`,
      },
      { type: 'separator' },
      {
        id: 'PATH',
        label: r.path,
        enabled: false,
        submenu: [
          { id: 'OFFSET', label: r.offset || 'Offset', click: callback },
          {
            id: 'DECOMPOSE_PATH', label: r.decompose_path, enabled: false, click: callback,
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
          { id: 'LAYER_COLOR_CONFIG', label: r.layer_color_config || 'Color Configuration', click: callback },
        ],
      },
      { type: 'separator' },
      { id: 'DOCUMENT_SETTING', label: r.document_setting || 'Document Setting', click: callback },
    ],
  });

  menuItems.push({
    id: '_view',
    label: r.view,
    submenu: [
      {
        id: 'ZOOM_IN', label: r.zoom_in || 'Zoom In', click: callback, accelerator: process.platform === 'win32' ? 'CmdOrCtrl++' : 'CmdOrCtrl+Plus',
      },
      {
        id: 'ZOOM_OUT', label: r.zoom_out || 'Zoom Out', click: callback, accelerator: `${fnKey}+-`,
      },
      { id: 'FITS_TO_WINDOW', label: r.fit_to_window || 'Fit To Window', click: callback },
      {
        id: 'ZOOM_WITH_WINDOW', label: r.zoom_with_window || 'Zoom With Window', click: callback, type: 'checkbox',
      },
      { type: 'separator' },
      {
        id: 'SHOW_GRIDS', label: r.show_grids || 'Show Grids', click: callback, type: 'checkbox', checked: true,
      },
      {
        id: 'SHOW_RULERS', label: r.show_rulers, click: callback, type: 'checkbox',
      },
      {
        id: 'SHOW_LAYER_COLOR', label: r.show_layer_color || 'Show Layer Color', click: callback, type: 'checkbox',
      },
      {
        id: 'ALIGN_TO_EDGES', label: r.align_to_edges, enabled: false, click: callback, type: 'checkbox',
      },
      {
        id: 'ANTI_ALIASING', label: r.anti_aliasing, click: callback, type: 'checkbox',
      },
    ],
  });

  menuItems.push({
    id: '_machines',
    label: r.machines || 'Machines',
    submenu: [
      {
        id: 'ADD_NEW_MACHINE', label: r.add_new_machine || 'Add New Machine', accelerator: `${fnKey}+M`, click: callback,
      },
      { id: 'NETWORK_TESTING', label: r.network_testing || 'Test Network', click: callback },
      { type: 'separator' },
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

  return menuItems;
}

function getDeviceMenuId(uuid, data) {
  return `device:${data.source}:${uuid}`;
}

function buildDeviceMenu(callback, uuid, data, isDevMode = false) {
  const { serial, source, name } = data;
  const menuLabel = data.source === 'lan' ? data.name : `${data.name} (USB)`;
  const machineName = name;
  let modelType = 'beambox-series';
  if (['delta-1', 'delta-1p'].includes(data.model)) modelType = 'delta-series';
  else if (['ado1'].includes(data.model)) modelType = 'ador-series';

  let submenu = [];
  if (['beambox-series', 'ador-series'].includes(modelType)) {
    submenu = [
      {
        id: 'DASHBOARD', uuid, serial, machineName, source, label: r.dashboard, click: callback,
      },
      {
        id: 'MACHINE_INFO', uuid, serial, machineName, source, label: r.machine_info, click: callback,
      },
      { type: 'separator' },
      {
        id: 'CALIBRATE_BEAMBOX_CAMERA', uuid, serial, machineName, source, label: r.calibrate_camera, click: callback,
      },
    ];

    if (data.model === 'fbm1') {
      submenu.push({
        id: 'CALIBRATE_BEAMBOX_CAMERA_BORDERLESS',
        uuid,
        serial,
        machineName,
        source,
        label: r.calibrate_beambox_camera_borderless,
        click: callback,
      });
      submenu.push({
        id: 'CALIBRATE_DIODE_MODULE',
        uuid,
        serial,
        machineName,
        source,
        label: r.calibrate_diode_module,
        click: callback,
      });
    } else if (modelType === 'ador-series') {
      if (isDevMode) {
        submenu.push({
          id: 'CALIBRATE_CAMERA_V2_FACTORY',
          uuid,
          serial,
          machineName,
          source,
          label: `${r.calibrate_camera} (Factory)`,
          click: callback,
        });
      }
      submenu.push({
        id: 'CALIBRATE_PRINTER_MODULE',
        uuid,
        serial,
        machineName,
        source,
        label: r.calibrate_printer_module,
        click: callback,
      }, {
        id: 'CALIBRATE_IR_MODULE',
        uuid,
        serial,
        machineName,
        source,
        label: r.calibrate_ir_module,
        click: callback,
      });
      if (isDevMode) {
        submenu.push({
          id: 'CATRIDGE_CHIP_SETTING',
          uuid,
          serial,
          machineName,
          source,
          label: 'Catridge Chip Setting',
          click: callback,
        });
      }
    }
    submenu.push({ type: 'separator' });
    if (modelType === 'ador-series') {
      submenu.push({
        id: 'CAMERA_CALIBRATION_DATA',
        label: r.camera_calibration_data,
        uuid,
        serial,
        source,
        submenu: [
          {
            id: 'UPLOAD_CALIBRATION_DATA', label: r.upload_data, uuid, serial, source, click: callback,
          },
          {
            id: 'DOWNLOAD_CALIBRATION_DATA', label: r.download_data, uuid, serial, source, click: callback,
          },
        ],
      });
    }
    submenu = submenu.concat([
      {
        id: 'UPDATE_FIRMWARE', uuid, serial, machineName, source, label: r.update_firmware, click: callback,
      },
      {
        id: 'DOWNLOAD_LOG',
        uuid,
        serial,
        machineName,
        source,
        label: r.download_log,
        submenu: [
          {
            id: 'LOG_NETWORK', label: r.log.network, uuid, serial, machineName, source, click: callback,
          },
          {
            id: 'LOG_HARDWARE', label: r.log.hardware, uuid, serial, machineName, source, click: callback,
          },
          {
            id: 'LOG_DISCOVER', label: r.log.discover, uuid, serial, machineName, source, click: callback,
          },
          {
            id: 'LOG_USB', label: r.log.usb, uuid, serial, machineName, source, click: callback,
          },
          {
            id: 'LOG_USBLIST', label: r.log.usblist, uuid, serial, machineName, source, click: callback,
          },
          {
            id: 'LOG_CAMERA', label: r.log.camera, uuid, serial, machineName, source, click: callback,
          },
          {
            id: 'LOG_CLOUD', label: r.log.cloud, uuid, serial, machineName, source, click: callback,
          },
          {
            id: 'LOG_PLAYER', label: r.log.player, uuid, serial, machineName, source, click: callback,
          },
          {
            id: 'LOG_ROBOT', label: r.log.robot, uuid, serial, machineName, source, click: callback,
          },
        ],
      },
    ]);
  } else {
    // delta series
    submenu = [
      {
        id: 'DASHBOARD', uuid, serial, source, label: r.dashboard, click: callback,
      },
      {
        id: 'MACHINE_INFO', uuid, serial, source, label: r.machine_info, click: callback,
      },
      {
        id: 'TOOLHEAD_INFO', uuid, serial, source, label: r.toolhead_info, click: callback,
      },
      { type: 'separator' },
      {
        id: 'CHANGE_FILAMENT', uuid, serial, source, label: r.change_material, click: callback,
      },
      {
        id: 'AUTO_LEVELING', uuid, serial, source, label: r.run_leveling, click: callback,
      },
      {
        id: 'COMMANDS',
        uuid,
        serial,
        source,
        label: r.commands,
        submenu: [
          {
            id: 'CALIBRATE_ORIGIN', label: r.calibrate_origin, uuid, serial, source, click: callback,
          },
          {
            id: 'MOVEMENT_TEST', label: r.movement_test, uuid, serial, source, click: callback,
          },
          {
            id: 'TURN_ON_LASER', label: r.turn_on_laser, uuid, serial, source, click: callback,
          },
          {
            id: 'AUTO_LEVELING_CLEAN', label: r.auto_leveling_clean, uuid, serial, source, click: callback,
          },
          {
            id: 'SET_TOOLHEAD_TEMPERATURE', label: r.set_toolhead_temperature, uuid, serial, source, click: callback,
          },
        ],
      },
      { type: 'separator' },
      {
        id: 'UPDATE_FIRMWARE_PARENT',
        uuid,
        serial,
        source,
        label: r.update_firmware,
        submenu: [
          {
            id: 'UPDATE_FIRMWARE', label: r.update_delta, uuid, serial, source, click: callback,
          },
          {
            id: 'UPDATE_TOOLHEAD', label: r.update_toolhead, uuid, serial, source, click: callback,
          },
        ],
      },
      {
        id: 'DOWNLOAD_LOG',
        uuid,
        serial,
        source,
        label: r.download_log,
        submenu: [
          {
            id: 'LOG_NETWORK', label: r.log.network, uuid, serial, source, click: callback,
          },
          {
            id: 'LOG_HARDWARE', label: r.log.hardware, uuid, serial, source, click: callback,
          },
          {
            id: 'LOG_DISCOVER', label: r.log.discover, uuid, serial, source, click: callback,
          },
          {
            id: 'LOG_USB', label: r.log.usb, uuid, serial, source, click: callback,
          },
          {
            id: 'LOG_CAMERA', label: r.log.camera, uuid, serial, source, click: callback,
          },
          {
            id: 'LOG_CLOUD', label: r.log.cloud, uuid, serial, source, click: callback,
          },
          {
            id: 'LOG_PLAYER', label: r.log.player, uuid, serial, source, click: callback,
          },
          {
            id: 'LOG_ROBOT', label: r.log.robot, uuid, serial, source, click: callback,
          },
        ],
      },
    ];
  }

  return new MenuItem({
    label: menuLabel,
    id: getDeviceMenuId(uuid, data),
    visible: true,
    submenu,
  });
}

class MenuManager extends EventEmitter {
  constructor() {
    super();
    this.device_list = {};
    this.constructMenu();
    this.isDevMode = false;

    ipcMain.on(events.NOTIFY_LANGUAGE, () => {
      const language = store.get('active-lang') || 'en';
      r = resource[language];
      if (!r) {
        r = resource.en;
      }
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
      const accountSubmenu = Menu.getApplicationMenu().items.find((i) => i.id === '_account').submenu;
      const signoutLabel = info ? `${r.sign_out} (${info.email})` : r.sign_out;
      const current = accountSubmenu.items;
      accountSubmenu.items = [];
      accountSubmenu.clear();

      for (const menuitem of current) {
        if (menuitem.id === 'SIGN_IN') {
          menuitem.visible = !info;
          accountSubmenu.append(menuitem);
        } else if (menuitem.id === 'SIGN_OUT') {
          const newSignOut = new MenuItem({
            id: 'SIGN_OUT',
            visible: !!info,
            click: menuitem.click,
            label: signoutLabel,
          });
          accountSubmenu.append(newSignOut);
        } else if (menuitem.id === 'MANAGE_ACCOUNT') {
          menuitem.enabled = !!info;
          accountSubmenu.append(menuitem);
        } else {
          accountSubmenu.append(menuitem);
        }
      }
      Menu.setApplicationMenu(Menu.getApplicationMenu());
    });

    ipcMain.on(events.POPUP_MENU, (e, show, options) => {
      this.popup_menu = Menu.buildFromTemplate([
        {
          label: 'Reload App',
          click: () => {
            this.emit('DEBUG-RELOAD');
          },
        },
        {
          label: 'Inspect',
          click: () => {
            this.emit('DEBUG-INSPECT');
          },
        },
      ]);
      this.popup_menu.popup(options);
    });
  }

  constructMenu() {
    this.appmenu = Menu.buildFromTemplate(
      buildMenuItems(this.on_menu_click.bind(this)),
    );

    for (const i in this.appmenu.items) {
      if (this.appmenu.items[i].id === '_machines') {
        this.deviceMenu = this.appmenu.items[i];
      } else if (this.appmenu.items[i].id === '_account') {
        this.accountMenu = this.appmenu.items[i];
      }
    }
    for (const devMenuId in this.device_list) {
      const data = this.device_list[devMenuId];
      const instance = buildDeviceMenu(
        this.on_menu_click.bind(this), data.uuid, data, this.isDevMode,
      );
      this.deviceMenu.submenu.append(instance);
    }
    Menu.setApplicationMenu(this.appmenu);
    this.emit('NEW_APP_MENU');
  }

  toggleMenu(ids, enabled) {
    const idList = Array.isArray(ids) ? ids : [ids];
    const iterStack = [...this.appmenu.items];
    while (iterStack.length > 0) {
      const item = iterStack.pop();
      if (item.submenu) {
        iterStack.push(...item.submenu.items);
      }
      if (idList.indexOf(item.id) >= 0) {
        item.enabled = enabled;
      }
    }
    Menu.setApplicationMenu(this.appmenu);
  }

  on_menu_click(event) {
    if (event.id) {
      this.emit(events.MENU_CLICK, event, this.appmenu);
    }
    if (process.platform === 'win32') {
      this.reset_custom_electron_titlebar();
    }
  }

  reset_custom_electron_titlebar() {
    BrowserWindow.getFocusedWindow().webContents.send(events.UPDATE_CUSTOM_TITLEBAR);
  }

  appendDevice(uuid, data) {
    const menuId = getDeviceMenuId(uuid, data);

    if (this.deviceMenu) {
      this.device_list[menuId] = data;
      const instance = buildDeviceMenu(this.on_menu_click.bind(this), uuid, data, this.isDevMode);

      if (data.source === 'h2h') {
        this.deviceMenu.submenu.insert(2, instance);
      } else {
        this.deviceMenu.submenu.append(instance);
      }
      Menu.setApplicationMenu(this.appmenu);
    } else {
      this.device_list[menuId] = data;
    }
  }

  updateDevice(uuid, data) {
    const menuId = getDeviceMenuId(uuid, data);
    this.device_list[menuId] = data;

    // var labelName = data.source === 'h2h' ? `${data.name} (USB)` : data.name;

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
    this.appendDevice(uuid, data);
    return true;
  }

  removeDevice(uuid, data) {
    const menuId = getDeviceMenuId(uuid, data);
    delete this.device_list[menuId];

    if (this.deviceMenu) {
      const current = this.deviceMenu.submenu.items;
      this.deviceMenu.submenu.items = [];
      this.deviceMenu.submenu.clear();

      for (const menuitem of current) {
        if (menuitem.id !== menuId) {
          this.deviceMenu.submenu.append(menuitem);
        }
      }
      Menu.setApplicationMenu(this.appmenu);
    }
  }
}

module.exports = MenuManager;
