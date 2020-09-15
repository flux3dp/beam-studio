const EventEmitter = require('events');
const {app, BrowserWindow, Menu, MenuItem, shell, ipcMain} = require('electron');
const resource = require('./menu-resource');
const events = require('./ipc-events');

let r = resource['en'];

function _buildOSXAppMenu(callback) {
    const currentChannel = app.getVersion().split('-')[1] || 'latest';
    const switchChannelLabel = currentChannel === 'latest' ? r.switch_to_beta : r.switch_to_latest;
    return {
        label: 'Beam Studio',
        submenu: [
            { label: r.about, role: 'about'},
            { id: 'SWITCH_VERSION',  label: switchChannelLabel, click: callback },
            { id: 'PREFERENCE',  label: r.preferences, accelerator: 'Cmd+,', click: callback },
            { type: 'separator' },
            { label: r.service, role: 'services', submenu: [] },
            { type: 'separator' },
            { label: r.hide, role: 'hide' },
            { label: r.hideothers, role: 'hideothers' },
            { type: 'separator' },
            { id: 'RELOAD_APP' ,label: r.reload_app, accelerator: 'Cmd+R', click: callback},
            { label: r.quit, role: 'quit'}
        ]
    };
}


function _buildFileMenu(fnKey, callback) {
    let menuItems = [
        { 'id': 'OPEN', label: r.open || 'Open', click: callback, 'accelerator': `${fnKey}+O` },
        { 'id': 'RECENT', label: r.recent || 'Open Recent', submenu: []},
        //{ 'id': 'TASK_INTERPRETER', label: 'Task Interpreter', click: callback},
        { type: 'separator' },
        { 'id': 'SAVE_SCENE', label: r.save_scene || 'Save Scene', click: callback, 'accelerator': `${fnKey}+S` },
        { 'id': 'SAVE_AS', label: r.save_as, click: callback, 'accelerator': `Shift+${fnKey}+S` },
        { type: 'separator' },
        { 'id': 'SAMPLES', label: r.samples || 'Examples', submenu: [
            { 'id': 'IMPORT_EXAMPLE', label: r.import_hello_beamo, click: callback },
            { 'id': 'IMPORT_HELLO_BEAMBOX', label: r.import_hello_beambox, click: callback },
            { 'id': 'IMPORT_MATERIAL_TESTING_ENGRAVE', label: r.import_material_testing_engrave, click: callback },
            { 'id': 'IMPORT_MATERIAL_TESTING_OLD', label: r.import_material_testing_old, click: callback },
            { 'id': 'IMPORT_MATERIAL_TESTING_CUT', label: r.import_material_testing_cut, click: callback },
            { 'id': 'IMPORT_MATERIAL_TESTING_SIMPLECUT', label: r.import_material_testing_simple_cut, click: callback },
            { 'id': 'IMPORT_MATERIAL_TESTING_LINE', label: r.import_material_testing_line, click: callback },
        ]},
        { type: 'separator' },
        { 'id': 'EXPORT_TO', label: r.export_to || 'Export to', submenu: [
            { 'id': 'EXPORT_BVG', label: 'BVG', click: callback},
            { 'id': 'EXPORT_SVG', label: r.export_SVG, click: callback},
            { 'id': 'EXPORT_PNG', label: 'PNG', click: callback},
            { 'id': 'EXPORT_JPG', label: 'JPG', click: callback},
            { 'id': 'EXPORT_FLUX_TASK', label: r.export_flux_task, click: callback, 'accelerator': `${fnKey}+E` }
        ]}
    ];

    if(process.platform !== 'darwin') {
        menuItems.push({ id: 'PREFERENCE',  label: r.preferences, accelerator: `${fnKey}+,`, click: callback });
        menuItems.push({ id: 'RELOAD_APP' ,label: r.reload_app, accelerator: `${fnKey}+R`, click: callback});
    }

    return {
        id: '_file',
        label: r.file,
        submenu: menuItems,
    }
}

function buildMenu(callback) {
    let menu = [];
    let fnKey =  process.platform === 'darwin' ? 'Cmd' : 'Ctrl';

    if(process.platform === 'darwin') {
        menu.push(_buildOSXAppMenu(callback));
    }

    menu.push(_buildFileMenu(fnKey, callback));

    menu.push({
        id: '_edit',
        label: r.edit,
        submenu: [
            { 'id': 'UNDO', label: r.undo || 'Undo', click: callback, 'accelerator': `${fnKey}+Z`},
            { 'id': 'REDO', label: r.redo || 'Redo', click: callback, 'accelerator': `${fnKey}+Shift+Z`},
            { type:'separator'},
            { 'id': 'CUT', label: r.cut, click: callback, 'accelerator': `${fnKey}+X`},
            { 'id': 'COPY', label: r.copy, click: callback, 'accelerator': `${fnKey}+C`},
            { 'id': 'PASTE', label: r.paste, click: callback, 'accelerator': `${fnKey}+V`},
            { 'id': 'DUPLICATE', label: r.duplicate || 'Duplicate', enabled: false, click: callback, 'accelerator': `${fnKey}+D` },
            { type:'separator'},
            { 'id': 'GROUP', label: r.group || 'Group', enabled: false, click: callback, 'accelerator': `${fnKey}+G` },
            { 'id': 'UNGROUP', label: r.ungroup || 'Ungroup', enabled: false, click: callback, 'accelerator': `${fnKey}+Shift+G` },
            { type:'separator'},
            { 'id': 'PATH', label: r.path, enabled: false, submenu: [
                { 'id': 'OFFSET', label: r.offset || 'Offset', click: callback},
                { 'id': 'DECOMPOSE_PATH', label: r.decompose_path, enabled: false, click: callback},
            ]},
            { 'id': 'PHOTO_EDIT', label: r.photo_edit || 'Edit Photo', enabled: false, submenu: [
                { 'id': 'IMAGE_SHARPEN', label: r.image_sharpen, click: callback },
                { 'id': 'IMAGE_CROP', label: r.image_crop, click: callback },
                { 'id': 'IMAGE_INVERT', label: r.image_invert, click: callback },
                { 'id': 'IMAGE_STAMP', label: r.image_stamp, click: callback },
                { 'id': 'IMAGE_VECTORIZE', label: r.image_vectorize, click: callback },
                { 'id': 'IMAGE_CURVE', label: r.image_curve, click: callback },
            ]},
            { 'id': 'SVG_EDIT', label: r.svg_edit || 'Edit Photo', enabled: false, submenu: [
                { 'id': 'DISASSEMBLE_USE', label: r.disassemble_use || 'Disassemble SVG', click: callback },
            ]},
            { 'id': 'LAYER', label: r.layer_setting, submenu: [
                { 'id': 'LAYER_COLOR_CONFIG', label: r.layer_color_config || 'Color Configuration', click: callback }
            ]},
            { type:'separator'},
            { 'id': 'ALIGN_TO_EDGES', label: r.align_to_edges, enabled: false, click: callback, type:'checkbox'},
            { type:'separator'},
            { 'id': 'OPTIMIZATION', label: r.optimization, submenu: [
                { 'id': 'SVG_NEST', label: r.arrangement_optimization, click: callback }
            ]},
            { type:'separator'},
            { 'id': 'DOCUMENT_SETTING', label: r.document_setting || 'Document Setting', click: callback},
            { type: 'separator' },
            { 'id': 'CLEAR_SCENE', label: r.clear_scene || 'Clear Scene', enabled: false, click: callback, 'accelerator': `${fnKey}+Shift+X` },
        ]
    });

    menu.push({
        id: '_view',
        label: r.view,
        submenu: [
            { 'id': 'ZOOM_IN', label: r.zoom_in || 'Zoom In', click: callback},
            { 'id': 'ZOOM_OUT', label: r.zoom_out || 'Zoom Out', click: callback},
            { 'id': 'FITS_TO_WINDOW', label: r.fit_to_window || 'Fit To Window', click: callback},
            { 'id': 'ZOOM_WITH_WINDOW', label: r.zoom_with_window || 'Zoom With Window', click: callback, type:'checkbox'},
            { type:'separator'},
            { 'id': 'SHOW_GRIDS', label: r.show_grids || 'Show Grids', click: callback, type:'checkbox', checked: true},
            { 'id': 'SHOW_RULERS', label: r.show_rulers, click: callback, type:'checkbox'},
            { 'id': 'SHOW_LAYER_COLOR', label: r.show_layer_color || 'Show Layer Color', click: callback, type:'checkbox'}
        ]
    });

    menu.push({
        id: '_machines',
        label: r.machines || 'Machines',
        submenu: [
            { 'id': 'ADD_NEW_MACHINE', label: r.add_new_machine || 'Add New Machine', 'accelerator': `${fnKey}+N`, click: callback},
            { id: 'NETWORK_TESTING', label: r.network_testing || 'Test Network', click: callback },
            {type: 'separator'}
        ]
    });

    if(process.platform === 'darwin') {
        menu.push({
            label: r.window,
            role: 'window',
            submenu: [
                {label: r.minimize,role: 'minimize'},
                {label: r.close, role: 'close'}
            ]
        });
    }

    const helpSubmenu = [];
    if (process.platform !== 'darwin') {
        helpSubmenu.push({ id: 'ABOUT_BEAM_STUDIO', label: r.about_beam_studio, click: callback});
    }
    helpSubmenu.push(...[
        { id: 'START_TUTORIAL', label: r.show_start_tutorial, click: callback },
        { id: 'HELP_CENTER', label: r.help_center || 'Help Center', click() { shell.openExternal(r.link.help_center); } },
        { id: 'CONTACT_US', label: r.contact || 'Contact Us', click() { shell.openExternal(r.link.contact_us); } },
        { type: 'separator' },
        { id: 'FORUM', label: r.forum || 'Forum', click() { shell.openExternal(r.link.forum); } },
        { type: 'separator' },
        { id: 'UPDATE_BS',  label: r.update, click: callback }
    ]);
    if (process.platform !== 'darwin') {
        const currentChannel = app.getVersion().split('-')[1] || 'latest';
        const switchChannelLabel = currentChannel === 'latest' ? r.switch_to_beta : r.switch_to_latest;
        helpSubmenu.push({ id: 'SWITCH_VERSION',  label: switchChannelLabel, click: callback });
    }
    helpSubmenu.push(...[
        { type: 'separator' },
        { id: 'BUG_REPORT', label: r.bug_report || 'Bug Report', click: callback },
        { id: 'DEV_TOOL', label: r.dev_tool || 'Debug Tool', click() {BrowserWindow.getFocusedWindow().webContents.openDevTools()} }
    ]);
    menu.push({
        id: '_help',
        label: r.help || 'Help',
        role: 'help',
        submenu: helpSubmenu,
    });

    return menu;
}


function getDeviceMenuId(uuid, data) {
    return `device:${data.source}:${uuid}`;
}

function buildDeviceMenu(callback, uuid, data) {
    let { serial, source } = data;
    let menuLabel = data.source == "lan" ? data.name : `${data.name} (USB)`;
    const modelType = (['fbm1', 'fbb1b', 'fbb1p', 'laser-b1','darwin-dev'].includes(data.model))?'beambox-series':'delta-series';
    let submenu = [];
    if(modelType === 'beambox-series') {
        submenu = [
            { id: 'DASHBOARD', uuid, serial, source, label: r.dashboard, click: callback },
            { id: 'MACHINE_INFO', uuid, serial, source, label: r.machine_info, click: callback },
            { type: 'separator' },
            { id: 'CALIBRATE_BEAMBOX_CAMERA', uuid, serial, source, label: r.calibrate_beambox_camera, click: callback },
        ];
        if (modelType === 'fbm1' || true) {
            submenu.push({
                id: 'CALIBRATE_BEAMBOX_CAMERA_BORDERLESS', 
                uuid, 
                serial, 
                source, 
                label: r.calibrate_beambox_camera_borderless, 
                click: callback
            });
        }
        submenu.push({
            id: 'CALIBRATE_DIODE_MODULE', 
            uuid, 
            serial, 
            source, 
            label: r.calibrate_diode_module, 
            click: callback
        });
        submenu = submenu.concat([
            { type: 'separator' },
            { id: 'UPDATE_FIRMWARE', uuid, serial, source, label: r.update_firmware, click: callback},
            { id: 'DOWNLOAD_LOG', uuid, serial, source, label: r.download_log, submenu: [
                { id: 'LOG_NETWORK', label: r.log.network, uuid, serial, source, click: callback },
                { id: 'LOG_HARDWARE', label: r.log.hardware, uuid, serial, source, click: callback },
                { id: 'LOG_DISCOVER', label: r.log.discover, uuid, serial, source, click: callback },
                { id: 'LOG_USB', label: r.log.usb, uuid, serial, source, click: callback },
                { id: 'LOG_USBLIST', label: r.log.usblist, uuid, serial, source, click: callback },
                { id: 'LOG_CAMERA', label: r.log.camera, uuid, serial, source, click: callback },
                { id: 'LOG_CLOUD', label: r.log.cloud, uuid, serial, source, click: callback },
                { id: 'LOG_PLAYER', label: r.log.player, uuid, serial, source, click: callback },
                { id: 'LOG_ROBOT', label: r.log.robot, uuid, serial, source, click: callback }
            ]},
        ]);
    } else {
        submenu = [
            { id: 'DASHBOARD', uuid, serial, source, label: r.dashboard, click: callback },
            { id: 'MACHINE_INFO', uuid, serial, source, label: r.machine_info, click: callback },
            { id: 'TOOLHEAD_INFO', uuid, serial, source, label: r.toolhead_info, click: callback },
            { type: 'separator' },
            { id: 'CHANGE_FILAMENT', uuid, serial, source, label: r.change_material, click: callback },
            { id: 'AUTO_LEVELING', uuid, serial, source, label: r.run_leveling, click: callback },
            { id: 'COMMANDS', uuid, serial, source, label: r.commands, submenu: [
                { id: 'CALIBRATE_ORIGIN', label: r.calibrate_origin, uuid, serial, source, click: callback },
                { id: 'MOVEMENT_TEST', label: r.movement_test, uuid, serial, source, click: callback },
                { id: 'TURN_ON_LASER', label: r.turn_on_laser, uuid, serial, source, click: callback },
                { id: 'AUTO_LEVELING_CLEAN', label: r.auto_leveling_clean, uuid, serial, source, click: callback },
                { id: 'SET_TOOLHEAD_TEMPERATURE', label: r.set_toolhead_temperature, uuid, serial, source, click: callback }
            ]},
            { type: 'separator' },
            { id: 'UPDATE_FIRMWARE_PARENT', uuid, serial, source, label: r.update_firmware, submenu: [
                { id: 'UPDATE_FIRMWARE', label: r.update_delta, uuid, serial, source, click: callback },
                { id: 'UPDATE_TOOLHEAD', label: r.update_toolhead, uuid, serial, source, click: callback }
            ]},
            { id: 'DOWNLOAD_LOG', uuid, serial, source, label: r.download_log, submenu: [
                { id: 'LOG_NETWORK', label: r.log.network, uuid, serial, source, click: callback },
                { id: 'LOG_HARDWARE', label: r.log.hardware, uuid, serial, source, click: callback },
                { id: 'LOG_DISCOVER', label: r.log.discover, uuid, serial, source, click: callback },
                { id: 'LOG_USB', label: r.log.usb, uuid, serial, source, click: callback },
                { id: 'LOG_CAMERA', label: r.log.camera, uuid, serial, source, click: callback },
                { id: 'LOG_CLOUD', label: r.log.cloud, uuid, serial, source, click: callback },
                { id: 'LOG_PLAYER', label: r.log.player, uuid, serial, source, click: callback },
                { id: 'LOG_ROBOT', label: r.log.robot, uuid, serial, source, click: callback }
            ]},
            { id: 'SET_AS_DEFAULT', label: r.set_as_default, uuid, serial, source, click: callback, type:'checkbox'}
        ];
    }

    return new MenuItem({
        label: menuLabel,
        id: getDeviceMenuId(uuid, data),
        visible: true,
        submenu: submenu
    });
}


function buildAccountMenu(callback, account) {
    return new MenuItem({
        label: account.nickname,
        click: callback
    });
}


class MenuManager extends EventEmitter {
    constructor(on_trigger) {
        super();
        this._device_list = {};
        this.constructMenu();

        ipcMain.on(events.NOTIFY_LANGUAGE, (e, language) => {
            language = language || 'en';
            r = resource[language];
            if (!r) {
                r = resource['en'];
            }
            this.constructMenu();
        });

        ipcMain.on(events.DISABLE_MENU_ITEM, (e, ids) => {
            this.toggleMenu(ids, false);
        });

        ipcMain.on(events.ENABLE_MENU_ITEM, (e, ids) => {
            this.toggleMenu(ids, true);
        });

        ipcMain.on(events.UPDATE_ACCOUNT, (e, account) => {
            const toggleSignIn = (nickname) => {
                
            };

            toggleSignIn(account.nickname);
            Menu.setApplicationMenu(this._appmenu);
        });

        ipcMain.on(events.SET_AS_DEFAULT, (e, device) => {
            this._deviceMenu.submenu.items.forEach(item => {
                if(item.label === device.name) {
                    item.checked = true;
                }
            });
            Menu.setApplicationMenu(this._appmenu);
        });

        ipcMain.on(events.POPUP_MENU, (e, show, options) => {
            this._popup_menu = Menu.buildFromTemplate([
                {
                    label: "Reload App", click: () => {
                        this.emit("DEBUG-RELOAD")
                    }
                },
                {
                    label: "Inspect", click: () => {
                        this.emit("DEBUG-INSPECT");
                    }
                }
            ]);
            this._popup_menu.popup(options);
        });
    }
    constructMenu() {
        this._appmenu = Menu.buildFromTemplate(
            buildMenu(this._on_menu_click.bind(this))
        );

        for(let i in this._appmenu.items) {
            if(this._appmenu.items[i].id === '_machines') {
                this._deviceMenu = this._appmenu.items[i];
            }
            else if(this._appmenu.items[i].id === '_account') {
                this._accountMenu = this._appmenu.items[i];
            }
        }
        for(let devMenuId in this._device_list) {
            let data = this._device_list[devMenuId];
            let instance = buildDeviceMenu(this._on_menu_click.bind(this), data.uuid, data);
            this._deviceMenu.submenu.append(instance);
        }
        Menu.setApplicationMenu(this._appmenu);
    }
    toggleMenu(ids, enabled) {
        ids = Array.isArray(ids) ? ids : [ids];
        let iterStack = [...this._appmenu.items];
        while (iterStack.length > 0) {
            let item = iterStack.pop();
            if (item.submenu) {
                iterStack.push(...item.submenu.items);
            }
            if(ids.indexOf(item.id) >= 0) {
                item.enabled = enabled;
            }
        }
        Menu.setApplicationMenu(this._appmenu);
    }
    _on_menu_click(event) {
        if(event.id) {
            this.emit(events.MENU_CLICK, event, this._appmenu);
        }
        if (process.platform === 'win32') {
            this.reset_custom_electron_titlebar();
        }
    }
    reset_custom_electron_titlebar() {
        BrowserWindow.getFocusedWindow().webContents.send(events.UPDATE_CUSTOM_TITLEBAR);
    }
    setWindowOpened() {
    }
    setWindowsClosed() {
    }
    _appendDevice(uuid, data) {
        let menuId = getDeviceMenuId(uuid, data);

        if(this._deviceMenu) {
            this._device_list[menuId] = data;
            let instance = buildDeviceMenu(this._on_menu_click.bind(this), uuid, data);

            if(data.source === "h2h") {
                this._deviceMenu.submenu.insert(2, instance);
            } else {
                this._deviceMenu.submenu.append(instance);
            }
            Menu.setApplicationMenu(this._appmenu);
        } else {
            this._device_list[menuId] = data;
            return;
        }
    }
    updateDevice(uuid, data) {
        let menuId = getDeviceMenuId(uuid, data);
        this._device_list[menuId] = data;

        var labelName = data.source === "h2h" ? `${data.name} (USB)` : data.name;

        for(let menuitem of this._deviceMenu.submenu.items) {
            if(menuitem.id === menuId) {
                if(menuitem.label !== data.name) {
                    menuitem.label = data.name;
                    Menu.setApplicationMenu(this._appmenu);
                }
                return;
            }
        }
        this._appendDevice(uuid, data);
    }
    removeDevice(uuid, data) {
        let menuId = getDeviceMenuId(uuid, data);
        delete this._device_list[menuId];

        if(this._deviceMenu) {
            let current = this._deviceMenu.submenu.items;
            this._deviceMenu.submenu.items = [];
            this._deviceMenu.submenu.clear();

            for(let menuitem of current) {
                if(menuitem.id !== menuId) {
                    this._deviceMenu.submenu.append(menuitem);
                }
            }
            Menu.setApplicationMenu(this._appmenu);
        }
    }
}

module.exports = MenuManager;
