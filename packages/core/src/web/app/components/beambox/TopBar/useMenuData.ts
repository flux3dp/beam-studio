import { useEffect, useMemo, useState } from 'react';

import { adorModels, fcodeV2Models, modelsWithModules, promarkModels } from '@core/app/actions/beambox/constant';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { MenuItemKey } from '@core/app/constants/menuItems';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useDockableStore } from '@core/app/stores/dockableStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { useIsMobile } from '@core/app/stores/screenStore';
import { discoverManager } from '@core/helpers/api/discover';
import { checkBM2, checkHxRf } from '@core/helpers/checkFeature';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import isWeb from '@core/helpers/is-web';
import { getModulesTranslations } from '@core/helpers/layer-module/layer-module-helper';
import useI18n from '@core/helpers/useI18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

export type MenuNodeType = 'checkbox' | 'divider' | 'item' | 'submenu';

export interface MenuNode {
  checked?: boolean;
  children?: MenuNode[];
  device?: IDeviceInfo;
  disabled?: boolean;
  hotkey?: MenuItemKey;
  id?: string;
  label?: string;
  type: MenuNodeType;
  url?: string;
  visible?: boolean;
}

const divider: MenuNode = { type: 'divider' };

const useMenuData = (email?: string): MenuNode[] => {
  const eventEmitter = useMemo(() => eventEmitterFactory.createEventEmitter('top-bar-menu'), []);
  const [devices, setDevices] = useState<IDeviceInfo[]>([]);

  const shouldShowRulers = useGlobalPreferenceStore((state) => state.show_rulers);
  const shouldShowGrids = useGlobalPreferenceStore((state) => state.show_grids);
  const shouldUseLayerColor = useGlobalPreferenceStore((state) => state.use_layer_color);
  const isUsingAntiAliasing = useGlobalPreferenceStore((state) => state['anti-aliasing']);
  const isAutoAlign = useGlobalPreferenceStore((state) => state.auto_align);
  const shouldZoomWithWindow = useGlobalPreferenceStore((state) => state.zoom_with_window);
  const isUvPrintFileEnabled = useGlobalPreferenceStore((state) => state['enable-uv-print-file']);

  const isPanelLayerControlsShown = useDockableStore((state) => state.panelLayerControls);
  const isPanelObjectControlsShown = useDockableStore((state) => state.panelObjectProperties);
  const isPanelPathControlsShown = useDockableStore((state) => state.panelPathEdit);

  const [duplicateDisabled, setDuplicateDisabled] = useState(true);
  const [svgEditDisabled, setSvgEditDisabled] = useState(true);
  const [decomposePathDisabled, setDecomposePathDisabled] = useState(true);
  const [groupDisabled, setGroupDisabled] = useState(true);
  const [ungroupDisabled, setUngroupDisabled] = useState(true);
  const [pathDisabled, setPathDisabled] = useState(true);
  const [imageEditDisabled, setImageEditDisabled] = useState(true);
  const [dockableDisabled, setDockableDisabled] = useState(false);

  const menuItemUpdater = {
    DECOMPOSE_PATH: setDecomposePathDisabled,
    DUPLICATE: setDuplicateDisabled,
    GROUP: setGroupDisabled,
    PATH: setPathDisabled,
    PHOTO_EDIT: setImageEditDisabled,
    RESET_LAYOUT: setDockableDisabled,
    SVG_EDIT: setSvgEditDisabled,
    UNGROUP: setUngroupDisabled,
  };

  useEffect(() => {
    eventEmitter.on('ENABLE_MENU_ITEM', (items: string[]) => {
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i] as keyof typeof menuItemUpdater;

        menuItemUpdater[item]?.(false);
      }
    });

    eventEmitter.on('DISABLE_MENU_ITEM', (items: string[]) => {
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i] as keyof typeof menuItemUpdater;

        menuItemUpdater[item]?.(true);
      }
    });

    return () => {
      eventEmitter.removeListener('ENABLE_MENU_ITEM');
      eventEmitter.removeListener('DISABLE_MENU_ITEM');
    };
  });

  useEffect(() => {
    const unregister = discoverManager.register('top-bar-menu', (newDevices: IDeviceInfo[]) => {
      newDevices.sort((a, b) => (a.name >= b.name ? 1 : -1));

      if (newDevices.map((d) => d.name).join('') !== devices.map((d) => d.name).join('')) {
        setDevices(newDevices);
      }
    });

    return unregister;
  }, [devices]);

  const lang = useI18n();
  const {
    beambox: {
      left_panel: {
        label: { curve_engraving: tCurveEngraving, my_cloud: tMyCloud },
      },
    },
    promark_connection_test: tPromarkConnectionTest,
    promark_settings: tPromarkSettings,
    topbar: { menu: menuCms },
  } = lang;

  const isMobile = useIsMobile();
  const modulesTranslations = getModulesTranslations();

  const buildDeviceSubmenu = (device: IDeviceInfo): MenuNode => {
    const { model, name, serial } = device;
    const hasModules = modelsWithModules.has(model);
    const supportedModules = hasModules ? getWorkarea(model).supportedModules : undefined;
    const isPromark = promarkModels.has(model);
    const isBeamo = model === 'fbm1';
    const isBb2 = model === 'fbb2';
    const isBeamo2 = model === 'fbm2';
    const isHexa2 = model === 'fhx2rf';
    const isAdor = adorModels.has(model);
    const calibrationChildren: MenuNode[] = [
      {
        device,
        disabled: isMobile,
        id: 'CALIBRATE_BEAMBOX_CAMERA',
        label: `${menuCms.calibrate_beambox_camera}${isMobile ? ' (PC Only)' : ''}`,
        type: 'item',
      },
      ...(isBb2 || isBeamo2 || isHexa2 || isAdor
        ? [
            {
              device,
              disabled: isMobile,
              id: 'CALIBRATE_CAMERA_ADVANCED',
              label: `${menuCms.calibrate_camera_advanced}${isMobile ? ' (PC Only)' : ''}`,
              type: 'item' as const,
            },
          ]
        : []),
      ...(supportedModules?.includes(LayerModule.PRINTER)
        ? [
            {
              device,
              disabled: isMobile,
              id: 'CALIBRATE_PRINTER_MODULE',
              label: menuCms.calibrate_printer_module,
              type: 'item' as const,
            },
          ]
        : []),
      ...(supportedModules?.includes(LayerModule.PRINTER_4C)
        ? [
            {
              device,
              disabled: isMobile,
              id: 'CALIBRATE_PRINTER_4C_MODULE',
              label: menuCms.calibrate_printer_module,
              type: 'item' as const,
            },
          ]
        : []),
      ...(supportedModules?.includes(LayerModule.UV_WHITE_INK)
        ? [
            {
              device,
              disabled: isMobile,
              id: 'CALIBRATE_UV_WHITE_INK_MODULE',
              label: `${menuCms.calibrate_printer_module} (${modulesTranslations[LayerModule.UV_WHITE_INK]})`,
              type: 'item' as const,
            },
          ]
        : []),
      ...(supportedModules?.includes(LayerModule.UV_VARNISH)
        ? [
            {
              device,
              disabled: isMobile,
              id: 'CALIBRATE_UV_VARNISH_MODULE',
              label: `${menuCms.calibrate_printer_module} (${modulesTranslations[LayerModule.UV_VARNISH]})`,
              type: 'item' as const,
            },
          ]
        : []),
      ...(supportedModules?.includes(LayerModule.LASER_1064)
        ? [
            {
              device,
              disabled: isMobile,
              id: 'CALIBRATE_IR_MODULE',
              label: menuCms.calibrate_ir_module,
              type: 'item' as const,
            },
          ]
        : []),
      ...(isBeamo
        ? [
            {
              device,
              disabled: isMobile,
              id: 'CALIBRATE_BEAMBOX_CAMERA_BORDERLESS',
              label: `${menuCms.calibrate_beambox_camera_borderless}${isMobile ? ' (PC Only)' : ''}`,
              type: 'item' as const,
            },
            {
              device,
              disabled: isMobile,
              id: 'CALIBRATE_DIODE_MODULE',
              label: `${menuCms.calibrate_diode_module}${isMobile ? ' (PC Only)' : ''}`,
              type: 'item' as const,
            },
          ]
        : []),
    ];

    const children: MenuNode[] = [
      { device, id: 'DASHBOARD', label: menuCms.dashboard, type: 'item' },
      { device, id: 'MACHINE_INFO', label: menuCms.machine_info, type: 'item' },
      { device, id: 'DEVICE_MAINTENANCE_CHECKLIST', label: menuCms.maintenance_checklist, type: 'item' },
      ...(isPromark
        ? [
            { device, id: 'PROMARK_SETTINGS', label: tPromarkSettings.title, type: 'item' as const },
            { device, id: 'Z_AXIS_ADJUSTMENT', label: tPromarkSettings.z_axis_adjustment.title, type: 'item' as const },
            { device, id: 'CONNECTION_TEST', label: tPromarkConnectionTest.title, type: 'item' as const },
          ]
        : []),
      divider,
      { children: calibrationChildren, label: menuCms.calibration, type: 'submenu' },
      ...(!isPromark ? [divider] : []),
      ...(fcodeV2Models.has(model)
        ? [
            {
              children: [
                {
                  device,
                  id: 'IMPORT_CALIBRATION_DATA',
                  label: menuCms.import_calibration_data,
                  type: 'item' as const,
                },
                {
                  device,
                  id: 'EXPORT_CALIBRATION_DATA',
                  label: menuCms.export_calibration_data,
                  type: 'item' as const,
                },
              ],
              label: menuCms.camera_calibration_data,
              type: 'submenu' as const,
            },
          ]
        : []),
      ...(!isPromark
        ? [
            {
              children: [
                { device, id: 'UPDATE_FIRMWARE', label: menuCms.update_firmware, type: 'item' as const },
                { device, id: 'UPDATE_MAINBOARD', label: menuCms.update_mainboard, type: 'item' as const },
                ...(isBeamo2
                  ? [{ device, id: 'UPDATE_PRINTER_BOARD', label: menuCms.update_printer_board, type: 'item' as const }]
                  : []),
              ],
              label: menuCms.update_machine,
              type: 'submenu' as const,
            },
          ]
        : []),
      ...(!isPromark
        ? [
            {
              children: [
                { device, id: 'LOG_NETWORK', label: menuCms.log.network, type: 'item' as const },
                { device, id: 'LOG_HARDWARE', label: menuCms.log.hardware, type: 'item' as const },
                { device, id: 'LOG_DISCOVER', label: menuCms.log.discover, type: 'item' as const },
                { device, id: 'LOG_USB', label: menuCms.log.usb, type: 'item' as const },
                { device, id: 'LOG_USBLIST', label: menuCms.log.usblist, type: 'item' as const },
                { device, id: 'LOG_CAMERA', label: menuCms.log.camera, type: 'item' as const },
                { device, id: 'LOG_PLAYER', label: menuCms.log.player, type: 'item' as const },
                { device, id: 'LOG_ROBOT', label: menuCms.log.robot, type: 'item' as const },
              ],
              label: menuCms.download_log,
              type: 'submenu' as const,
            },
          ]
        : []),
    ];

    return { children, id: serial, label: name, type: 'submenu' };
  };

  const fileMenu: MenuNode = {
    children: [
      { hotkey: 'clear_scene', id: 'CLEAR_SCENE', type: 'item' },
      { id: 'OPEN', label: menuCms.open, type: 'item' },
      { id: 'SHOW_MY_CLOUD', label: tMyCloud, type: 'item' },
      divider,
      { hotkey: 'save_scene', id: 'SAVE_SCENE', type: 'item' },
      { hotkey: 'save_as', id: 'SAVE_AS', type: 'item' },
      { id: 'SAVE_TO_CLOUD', label: menuCms.save_to_cloud, type: 'item' },
      divider,
      {
        children: [
          {
            children: [
              { id: 'IMPORT_EXAMPLE', label: menuCms.import_hello_beamo, type: 'item' },
              { id: 'IMPORT_HELLO_BEAMBOX', label: menuCms.import_hello_beambox, type: 'item' },
              { id: 'IMPORT_EXAMPLE_HEXA', label: menuCms.import_hexa_example, type: 'item' as const },
              ...(checkHxRf()
                ? [{ id: 'IMPORT_EXAMPLE_HEXA_RF', label: menuCms.import_hexa_rf_example, type: 'item' as const }]
                : []),
              {
                children: [
                  { id: 'IMPORT_EXAMPLE_ADOR_LASER', label: menuCms.import_ador_laser_example, type: 'item' },
                  {
                    id: 'IMPORT_EXAMPLE_ADOR_PRINT_SINGLE',
                    label: menuCms.import_ador_printing_example_single,
                    type: 'item',
                  },
                  {
                    id: 'IMPORT_EXAMPLE_ADOR_PRINT_FULL',
                    label: menuCms.import_ador_printing_example_full,
                    type: 'item',
                  },
                ],
                label: 'Ador',
                type: 'submenu',
              },
              ...(checkBM2()
                ? [
                    {
                      children: [
                        {
                          id: 'IMPORT_EXAMPLE_BEAMO_2_LASER',
                          label: menuCms.import_beamo_2_laser_example,
                          type: 'item' as const,
                        },
                        {
                          id: 'IMPORT_EXAMPLE_BEAMO_2_PRINT',
                          label: menuCms.import_beamo_2_printing_example,
                          type: 'item' as const,
                        },
                      ],
                      label: 'beamo II',
                      type: 'submenu' as const,
                    },
                  ]
                : []),
              {
                children: [
                  { id: 'IMPORT_EXAMPLE_BEAMBOX_2', label: menuCms.import_beambox_2_example, type: 'item' },
                  { id: 'IMPORT_BEAMBOX_2_FOCUS_PROBE', label: menuCms.import_beambox_2_focus_probe, type: 'item' },
                ],
                label: 'Beambox II',
                type: 'submenu',
              },
              ...(!isWeb()
                ? [
                    { id: 'IMPORT_EXAMPLE_PROMARK', label: menuCms.import_promark_example, type: 'item' as const },
                    {
                      id: 'IMPORT_EXAMPLE_PROMARK_ENGRAVING_1',
                      label: menuCms.import_promark_engraving_example_1,
                      type: 'item' as const,
                    },
                    {
                      id: 'IMPORT_EXAMPLE_PROMARK_ENGRAVING_2',
                      label: menuCms.import_promark_engraving_example_2,
                      type: 'item' as const,
                    },
                  ]
                : []),
            ],
            label: menuCms.example_files,
            type: 'submenu',
          },
          {
            children: [
              { id: 'IMPORT_MATERIAL_TESTING_ENGRAVE', label: menuCms.import_material_testing_engrave, type: 'item' },
              { id: 'IMPORT_MATERIAL_TESTING_OLD', label: menuCms.import_material_testing_old, type: 'item' },
              { id: 'IMPORT_MATERIAL_TESTING_CUT', label: menuCms.import_material_testing_cut, type: 'item' },
              {
                id: 'IMPORT_MATERIAL_TESTING_SIMPLECUT',
                label: menuCms.import_material_testing_simple_cut,
                type: 'item',
              },
              { id: 'IMPORT_MATERIAL_TESTING_LINE', label: menuCms.import_material_testing_line, type: 'item' },
              { id: 'IMPORT_MATERIAL_TESTING_PRINT', label: menuCms.import_material_printing_test, type: 'item' },
            ],
            label: menuCms.material_test,
            type: 'submenu',
          },
          ...(!isWeb()
            ? [
                {
                  children: [
                    {
                      id: 'IMPORT_EXAMPLE_PROMARK_MOPA_20W_COLOR',
                      label: menuCms.import_promark_mopa_20w_color,
                      type: 'item' as const,
                    },
                    {
                      id: 'IMPORT_EXAMPLE_PROMARK_MOPA_60W_COLOR',
                      label: menuCms.import_promark_mopa_60w_color,
                      type: 'item' as const,
                    },
                    {
                      id: 'IMPORT_EXAMPLE_PROMARK_MOPA_60W_COLOR_2',
                      label: `${menuCms.import_promark_mopa_60w_color} - 2`,
                      type: 'item' as const,
                    },
                    {
                      id: 'IMPORT_EXAMPLE_PROMARK_MOPA_100W_COLOR',
                      label: menuCms.import_promark_mopa_100w_color,
                      type: 'item' as const,
                    },
                    {
                      id: 'IMPORT_EXAMPLE_PROMARK_MOPA_100W_COLOR_2',
                      label: `${menuCms.import_promark_mopa_100w_color} - 2`,
                      type: 'item' as const,
                    },
                  ],
                  label: menuCms.promark_color_test,
                  type: 'submenu' as const,
                },
              ]
            : []),
          { id: 'IMPORT_ACRYLIC_FOCUS_PROBE', label: menuCms.import_acrylic_focus_probe, type: 'item' },
        ],
        label: menuCms.samples,
        type: 'submenu',
      },
      divider,
      {
        children: [
          { id: 'EXPORT_BVG', label: menuCms.export_BVG, type: 'item' },
          { id: 'EXPORT_SVG', label: menuCms.export_SVG, type: 'item' },
          { id: 'EXPORT_PNG', label: menuCms.export_PNG, type: 'item' },
          { id: 'EXPORT_JPG', label: menuCms.export_JPG, type: 'item' },
          { hotkey: 'export_flux_task', id: 'EXPORT_FLUX_TASK', type: 'item' },
          ...(isUvPrintFileEnabled
            ? [{ id: 'EXPORT_UV_PRINT', label: menuCms.export_UV_print, type: 'item' as const }]
            : []),
        ],
        label: menuCms.export_to,
        type: 'submenu',
      },
      divider,
      { hotkey: 'preferences', id: 'PREFERENCE', type: 'item' },
    ],
    label: menuCms.file,
    type: 'submenu',
  };

  const editMenu: MenuNode = {
    children: [
      { hotkey: 'undo', id: 'UNDO', type: 'item' },
      { hotkey: 'redo', id: 'REDO', type: 'item' },
      divider,
      { hotkey: 'cut', id: 'CUT', type: 'item' },
      { hotkey: 'copy', id: 'COPY', type: 'item' },
      { hotkey: 'paste', id: 'PASTE', type: 'item' },
      { hotkey: 'paste_in_place', id: 'PASTE_IN_PLACE', type: 'item' },
      { disabled: duplicateDisabled, hotkey: 'duplicate', id: 'DUPLICATE', type: 'item' },
      divider,
      { disabled: groupDisabled, hotkey: 'group', id: 'GROUP', type: 'item' },
      { disabled: ungroupDisabled, hotkey: 'ungroup', id: 'UNGROUP', type: 'item' },
      divider,
      {
        children: [
          { id: 'OFFSET', label: menuCms.offset, type: 'item' },
          { disabled: decomposePathDisabled, id: 'DECOMPOSE_PATH', label: menuCms.decompose_path, type: 'item' },
        ],
        disabled: pathDisabled,
        label: menuCms.path,
        type: 'submenu',
      },
      {
        children: [
          { id: 'IMAGE_SHARPEN', label: menuCms.image_sharpen, type: 'item' },
          { id: 'IMAGE_CROP', label: menuCms.image_crop, type: 'item' },
          { id: 'IMAGE_INVERT', label: menuCms.image_invert, type: 'item' },
          { id: 'IMAGE_STAMP', label: lang.stamp_maker_panel.title, type: 'item' },
          { id: 'IMAGE_VECTORIZE', label: menuCms.image_vectorize, type: 'item' },
          { id: 'IMAGE_CURVE', label: menuCms.image_curve, type: 'item' },
        ],
        disabled: imageEditDisabled,
        label: menuCms.photo_edit,
        type: 'submenu',
      },
      {
        children: [{ id: 'DISASSEMBLE_USE', label: menuCms.disassemble_use, type: 'item' }],
        disabled: svgEditDisabled,
        label: menuCms.svg_edit,
        type: 'submenu',
      },
      {
        children: [{ id: 'LAYER_COLOR_CONFIG', label: menuCms.layer_color_config, type: 'item' }],
        label: menuCms.layer_setting,
        type: 'submenu',
      },
      divider,
      { id: 'DOCUMENT_SETTING', label: menuCms.document_setting, type: 'item' },
      { id: 'ROTARY_SETUP', label: menuCms.rotary_setup, type: 'item' },
    ],
    label: menuCms.edit,
    type: 'submenu',
  };

  const viewMenu: MenuNode = {
    children: [
      { checked: false, hotkey: 'zoom_in', id: 'ZOOM_IN', type: 'checkbox' },
      { checked: false, hotkey: 'zoom_out', id: 'ZOOM_OUT', type: 'checkbox' },
      { checked: false, id: 'FITS_TO_WINDOW', label: menuCms.fit_to_window, type: 'checkbox' },
      { checked: shouldZoomWithWindow, id: 'ZOOM_WITH_WINDOW', label: menuCms.zoom_with_window, type: 'checkbox' },
      divider,
      { checked: shouldShowGrids, id: 'SHOW_GRIDS', label: menuCms.show_grids, type: 'checkbox' },
      { checked: shouldShowRulers, id: 'SHOW_RULERS', label: menuCms.show_rulers, type: 'checkbox' },
      { checked: shouldUseLayerColor, id: 'SHOW_LAYER_COLOR', label: menuCms.show_layer_color, type: 'checkbox' },
      { checked: isAutoAlign, id: 'AUTO_ALIGN', label: menuCms.auto_align, type: 'checkbox' },
      { checked: isUsingAntiAliasing, id: 'ANTI_ALIASING', label: menuCms.anti_aliasing, type: 'checkbox' },
    ],
    label: menuCms.view,
    type: 'submenu',
  };

  const machinesMenu: MenuNode = {
    children: [
      { hotkey: 'add_new_machine', id: 'ADD_NEW_MACHINE', type: 'item' },
      { id: 'NETWORK_TESTING', label: menuCms.network_testing, type: 'item' },
      ...devices.map((device) => buildDeviceSubmenu(device)),
    ],
    label: menuCms.machines,
    type: 'submenu',
  };

  const toolsMenu: MenuNode = {
    children: [{ id: 'START_CURVE_ENGRAVING_MODE', label: tCurveEngraving.title, type: 'item' }],
    label: menuCms.tools.title,
    type: 'submenu',
  };

  const accountMenu: MenuNode = {
    children: [
      ...(email
        ? [{ id: 'SIGN_OUT', label: `${menuCms.logout} (${email})`, type: 'item' as const }]
        : [{ id: 'SIGN_IN', label: menuCms.login_or_register, type: 'item' as const }]),
      { id: 'DESIGN_MARKET', label: menuCms.design_market, type: 'item', url: menuCms.link.design_market },
      { disabled: email === null, id: 'MANAGE_ACCOUNT', label: menuCms.manage_account, type: 'item' },
    ],
    label: menuCms.account,
    type: 'submenu',
  };

  const windowMenu: MenuNode = {
    children: [
      { disabled: dockableDisabled, id: 'RESET_LAYOUT', label: menuCms.reset_layout, type: 'item' },
      divider,
      {
        checked: isPanelLayerControlsShown,
        disabled: dockableDisabled,
        id: 'SHOW_LAYER_CONTROLS_PANEL',
        label: menuCms.tab_layers,
        type: 'checkbox',
      },
      {
        checked: isPanelObjectControlsShown,
        disabled: dockableDisabled,
        id: 'SHOW_OBJECT_CONTROLS_PANEL',
        label: menuCms.tab_objects,
        type: 'checkbox',
      },
      {
        checked: isPanelPathControlsShown,
        disabled: dockableDisabled,
        id: 'SHOW_PATH_CONTROLS_PANEL',
        label: menuCms.tab_path_edit,
        type: 'checkbox',
      },
    ],
    label: menuCms.window,
    type: 'submenu',
    visible: !isMobile,
  };

  const helpMenu: MenuNode = {
    children: [
      { id: 'ABOUT_BEAM_STUDIO', label: menuCms.about_beam_studio, type: 'item' },
      ...(!isMobile
        ? [
            { id: 'START_TUTORIAL', label: menuCms.show_start_tutorial, type: 'item' as const },
            { id: 'START_UI_INTRO', label: menuCms.show_ui_intro, type: 'item' as const },
          ]
        : []),
      { id: 'START_GESTURE_INTRO', label: menuCms.show_gesture_tutorial, type: 'item' },
      { id: 'MAINTENANCE_CHECKLIST', label: menuCms.maintenance_checklist, type: 'item' },
      { id: 'CHANGE_LOGS', label: menuCms.change_logs, type: 'item' },
      { id: 'HELP_CENTER', label: menuCms.help_center, type: 'item', url: menuCms.link.help_center },
      { id: 'KEYBOARD_SHORTCUTS', label: menuCms.keyboard_shortcuts, type: 'item', url: menuCms.link.shortcuts },
      { id: 'CONTACT_US', label: menuCms.contact, type: 'item', url: menuCms.link.contact_us },
      {
        children: [{ id: 'PLUGIN_AUTOCAD', label: 'AutoCAD', type: 'item', url: menuCms.link.autocad }],
        label: menuCms.plugin,
        type: 'submenu',
      },
      divider,
      { id: 'FORUM', label: menuCms.forum, type: 'item', url: menuCms.link.forum },
      { id: 'FOLLOW_US', label: menuCms.follow_us, type: 'item' },
    ],
    label: menuCms.help,
    type: 'submenu',
  };

  return [fileMenu, editMenu, viewMenu, machinesMenu, toolsMenu, accountMenu, windowMenu, helpMenu];
};

export default useMenuData;
