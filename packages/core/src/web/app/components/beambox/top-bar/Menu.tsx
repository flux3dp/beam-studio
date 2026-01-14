import React, { useEffect, useMemo, useState } from 'react';

import { MenuDivider, MenuItem, SubMenu, Menu as TopBarMenu } from '@szhsin/react-menu';

import { adorModels, hexaRfModels, modelsWithModules, promarkModels } from '@core/app/actions/beambox/constant';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { menuItems } from '@core/app/constants/menuItems';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { discoverManager } from '@core/helpers/api/discover';
import { checkBM2, checkHxRf } from '@core/helpers/checkFeature';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import isWeb from '@core/helpers/is-web';
import { getModulesTranslations } from '@core/helpers/layer-module/layer-module-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

interface Props {
  email?: string;
}

export default function Menu({ email }: Props): React.JSX.Element {
  const eventEmitter = useMemo(() => eventEmitterFactory.createEventEmitter('top-bar-menu'), []);
  const [devices, setDevices] = useState(Array<IDeviceInfo>());
  const shouldShowRulers = useGlobalPreferenceStore((state) => state.show_rulers);
  const shouldShowGrids = useGlobalPreferenceStore((state) => state.show_grids);
  const shouldUseLayerColor = useGlobalPreferenceStore((state) => state.use_layer_color);
  const isUsingAntiAliasing = useGlobalPreferenceStore((state) => state['anti-aliasing']);
  const isAutoAlign = useGlobalPreferenceStore((state) => state.auto_align);
  const shouldZoomWithWindow = useGlobalPreferenceStore((state) => state.zoom_with_window);
  const isUvPrintFileEnabled = useGlobalPreferenceStore((state) => state['enable-uv-print-file']);
  const [duplicateDisabled, setDuplicateDisabled] = useState(true);
  const [svgEditDisabled, setSvgEditDisabled] = useState(true);
  const [decomposePathDisabled, setDecomposePathDisabled] = useState(true);
  const [groupDisabled, setGroupDisabled] = useState(true);
  const [ungroupDisabled, setUngroupDisabled] = useState(true);
  const [pathDisabled, setPathDisabled] = useState(true);
  const [imageEditDisabled, setImageEditDisabled] = useState(true);
  const menuItemUpdater = {
    DECOMPOSE_PATH: setDecomposePathDisabled,
    DUPLICATE: setDuplicateDisabled,
    GROUP: setGroupDisabled,
    PATH: setPathDisabled,
    PHOTO_EDIT: setImageEditDisabled,
    SVG_EDIT: setSvgEditDisabled,
    UNGROUP: setUngroupDisabled,
  };
  const isMobile = useIsMobile();

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
  const callback = (id: string, device?: IDeviceInfo) => {
    eventEmitter.emit('MENU_CLICK', null, {
      id,
      machineName: device?.name,
      serial: device?.serial,
      uuid: device?.uuid,
    });
  };
  const openPage = (url: string) => browser.open(url);
  const hotkey = (action: string): React.JSX.Element => (
    <>
      <span className="action">{(menuCms as any)[action]}</span>
      <span className="hotkey">{menuItems[action].representation}</span>
    </>
  );

  const deviceMenus = () => {
    const submenus = [];
    const modulesTranslations = getModulesTranslations();

    for (const device of devices) {
      const { model, name, serial } = device;
      const hasModules = modelsWithModules.has(model);
      const supportedModules = hasModules ? getWorkarea(model).supportedModules : undefined;
      const isAdor = adorModels.has(model);
      const isPromark = promarkModels.has(model);
      const isBeamo = model === 'fbm1';
      const isBb2 = model === 'fbb2';
      const isBeamo2 = model === 'fbm2';
      const isHexa2 = hexaRfModels.has(model);

      // Note: SubMenu doesn't support a React.Fragment wrapper (<>...</>) as a child.
      submenus.push(
        <SubMenu key={serial} label={name}>
          <MenuItem onClick={() => callback('DASHBOARD', device)}>{menuCms.dashboard}</MenuItem>
          <MenuItem onClick={() => callback('MACHINE_INFO', device)}>{menuCms.machine_info}</MenuItem>
          {isPromark && (
            <MenuItem onClick={() => callback('PROMARK_SETTINGS', device)}>{tPromarkSettings.title}</MenuItem>
          )}
          {isPromark && (
            <MenuItem onClick={() => callback('Z_AXIS_ADJUSTMENT', device)}>
              {tPromarkSettings.z_axis_adjustment.title}
            </MenuItem>
          )}
          {isPromark && (
            <MenuItem onClick={() => callback('CONNECTION_TEST', device)}>{tPromarkConnectionTest.title}</MenuItem>
          )}
          <MenuDivider />
          <SubMenu label={menuCms.calibration}>
            <MenuItem disabled={isMobile} onClick={() => callback('CALIBRATE_BEAMBOX_CAMERA', device)}>
              {menuCms.calibrate_beambox_camera} {isMobile && '(PC Only)'}
            </MenuItem>
            {(isBb2 || isBeamo2 || isHexa2) && (
              <MenuItem disabled={isMobile} onClick={() => callback('CALIBRATE_CAMERA_ADVANCED', device)}>
                {menuCms.calibrate_camera_advanced} {isMobile && '(PC Only)'}
              </MenuItem>
            )}
            {supportedModules?.includes(LayerModule.PRINTER) && (
              <MenuItem disabled={isMobile} onClick={() => callback('CALIBRATE_PRINTER_MODULE', device)}>
                {menuCms.calibrate_printer_module}
              </MenuItem>
            )}
            {supportedModules?.includes(LayerModule.PRINTER_4C) && (
              <MenuItem disabled={isMobile} onClick={() => callback('CALIBRATE_PRINTER_4C_MODULE', device)}>
                {menuCms.calibrate_printer_module}
              </MenuItem>
            )}
            {supportedModules?.includes(LayerModule.UV_WHITE_INK) && (
              <MenuItem disabled={isMobile} onClick={() => callback('CALIBRATE_UV_WHITE_INK_MODULE', device)}>
                {menuCms.calibrate_printer_module} ({modulesTranslations[LayerModule.UV_WHITE_INK]})
              </MenuItem>
            )}
            {supportedModules?.includes(LayerModule.UV_VARNISH) && (
              <MenuItem disabled={isMobile} onClick={() => callback('CALIBRATE_UV_VARNISH_MODULE', device)}>
                {menuCms.calibrate_printer_module} ({modulesTranslations[LayerModule.UV_VARNISH]})
              </MenuItem>
            )}
            {supportedModules?.includes(LayerModule.LASER_1064) && (
              <MenuItem disabled={isMobile} onClick={() => callback('CALIBRATE_IR_MODULE', device)}>
                {menuCms.calibrate_ir_module}
              </MenuItem>
            )}
            {isBeamo && (
              <MenuItem disabled={isMobile} onClick={() => callback('CALIBRATE_BEAMBOX_CAMERA_BORDERLESS', device)}>
                {menuCms.calibrate_beambox_camera_borderless} {isMobile && '(PC Only)'}
              </MenuItem>
            )}
            {isBeamo && (
              <MenuItem disabled={isMobile} onClick={() => callback('CALIBRATE_DIODE_MODULE', device)}>
                {menuCms.calibrate_diode_module} {isMobile && '(PC Only)'}
              </MenuItem>
            )}
          </SubMenu>
          {!isPromark && <MenuDivider />}
          {(isAdor || isBb2 || isBeamo2) && (
            <SubMenu label={menuCms.camera_calibration_data}>
              <MenuItem onClick={() => callback('UPLOAD_CALIBRATION_DATA', device)}>{menuCms.upload_data}</MenuItem>
              <MenuItem onClick={() => callback('DOWNLOAD_CALIBRATION_DATA', device)}>{menuCms.download_data}</MenuItem>
            </SubMenu>
          )}

          {!isPromark && (
            <SubMenu label={menuCms.update_machine}>
              <MenuItem onClick={() => callback('UPDATE_FIRMWARE', device)}>{menuCms.update_firmware}</MenuItem>
              <MenuItem onClick={() => callback('UPDATE_MAINBOARD', device)}>{menuCms.update_mainboard}</MenuItem>
              {isBeamo2 && (
                <MenuItem onClick={() => callback('UPDATE_PRINTER_BOARD', device)}>
                  {menuCms.update_printer_board}
                </MenuItem>
              )}
            </SubMenu>
          )}
          {!isPromark && (
            <SubMenu label={menuCms.download_log}>
              <MenuItem onClick={() => callback('LOG_NETWORK', device)}>{menuCms.log.network}</MenuItem>
              <MenuItem onClick={() => callback('LOG_HARDWARE', device)}>{menuCms.log.hardware}</MenuItem>
              <MenuItem onClick={() => callback('LOG_DISCOVER', device)}>{menuCms.log.discover}</MenuItem>
              <MenuItem onClick={() => callback('LOG_USB', device)}>{menuCms.log.usb}</MenuItem>
              <MenuItem onClick={() => callback('LOG_USBLIST', device)}>{menuCms.log.usblist}</MenuItem>
              <MenuItem onClick={() => callback('LOG_CAMERA', device)}>{menuCms.log.camera}</MenuItem>
              <MenuItem onClick={() => callback('LOG_PLAYER', device)}>{menuCms.log.player}</MenuItem>
              <MenuItem onClick={() => callback('LOG_ROBOT', device)}>{menuCms.log.robot}</MenuItem>
            </SubMenu>
          )}
        </SubMenu>,
      );
    }

    return submenus;
  };

  return (
    <TopBarMenu
      menuButton={
        <div className="menu-btn-container">
          <img className="icon" src="img/logo-line.svg" />
          <img className="icon-arrow" src="img/icon-arrow-d.svg" />
        </div>
      }
    >
      <SubMenu label={menuCms.file}>
        <MenuItem onClick={() => callback('CLEAR_SCENE')}>{hotkey('clear_scene')}</MenuItem>
        <MenuItem onClick={() => callback('OPEN')}>{menuCms.open}</MenuItem>
        <MenuItem onClick={() => callback('SHOW_MY_CLOUD')}>{tMyCloud}</MenuItem>
        <MenuDivider />
        <MenuItem onClick={() => callback('SAVE_SCENE')}>{hotkey('save_scene')}</MenuItem>
        <MenuItem onClick={() => callback('SAVE_AS')}>{hotkey('save_as')}</MenuItem>
        <MenuItem onClick={() => callback('SAVE_TO_CLOUD')}>{menuCms.save_to_cloud}</MenuItem>
        <MenuDivider />
        <SubMenu label={menuCms.samples}>
          <SubMenu label={menuCms.example_files}>
            <MenuItem onClick={() => callback('IMPORT_EXAMPLE_ADOR_LASER')}>
              {menuCms.import_ador_laser_example}
            </MenuItem>
            <MenuItem onClick={() => callback('IMPORT_EXAMPLE_ADOR_PRINT_SINGLE')}>
              {menuCms.import_ador_printing_example_single}
            </MenuItem>
            <MenuItem onClick={() => callback('IMPORT_EXAMPLE_ADOR_PRINT_FULL')}>
              {menuCms.import_ador_printing_example_full}
            </MenuItem>
            <MenuItem onClick={() => callback('IMPORT_EXAMPLE')}>{menuCms.import_hello_beamo}</MenuItem>
            {checkBM2() && (
              <MenuItem onClick={() => callback('IMPORT_EXAMPLE_BEAMO_2_LASER')}>
                {menuCms.import_beamo_2_laser_example}
              </MenuItem>
            )}
            {checkBM2() && (
              <MenuItem onClick={() => callback('IMPORT_EXAMPLE_BEAMO_2_PRINT')}>
                {menuCms.import_beamo_2_printing_example}
              </MenuItem>
            )}
            <MenuItem onClick={() => callback('IMPORT_HELLO_BEAMBOX')}>{menuCms.import_hello_beambox}</MenuItem>
            <MenuItem onClick={() => callback('IMPORT_EXAMPLE_BEAMBOX_2')}>{menuCms.import_beambox_2_example}</MenuItem>
            <MenuItem onClick={() => callback('IMPORT_EXAMPLE_HEXA')}>{menuCms.import_hexa_example}</MenuItem>
            {checkHxRf() && (
              <MenuItem onClick={() => callback('IMPORT_EXAMPLE_HEXA_RF')}>{menuCms.import_hexa_rf_example}</MenuItem>
            )}
            {!isWeb() && (
              <MenuItem onClick={() => callback('IMPORT_EXAMPLE_PROMARK')}>{menuCms.import_promark_example}</MenuItem>
            )}
          </SubMenu>
          <SubMenu label={menuCms.material_test}>
            <MenuItem onClick={() => callback('IMPORT_MATERIAL_TESTING_ENGRAVE')}>
              {menuCms.import_material_testing_engrave}
            </MenuItem>
            <MenuItem onClick={() => callback('IMPORT_MATERIAL_TESTING_OLD')}>
              {menuCms.import_material_testing_old}
            </MenuItem>
            <MenuItem onClick={() => callback('IMPORT_MATERIAL_TESTING_CUT')}>
              {menuCms.import_material_testing_cut}
            </MenuItem>
            <MenuItem onClick={() => callback('IMPORT_MATERIAL_TESTING_SIMPLECUT')}>
              {menuCms.import_material_testing_simple_cut}
            </MenuItem>
            <MenuItem onClick={() => callback('IMPORT_MATERIAL_TESTING_LINE')}>
              {menuCms.import_material_testing_line}
            </MenuItem>
            <MenuItem onClick={() => callback('IMPORT_MATERIAL_TESTING_PRINT')}>
              {menuCms.import_material_printing_test}
            </MenuItem>
          </SubMenu>
          {!isWeb() && (
            <SubMenu label={menuCms.promark_color_test}>
              <MenuItem onClick={() => callback('IMPORT_EXAMPLE_PROMARK_MOPA_20W_COLOR')}>
                {menuCms.import_promark_mopa_20w_color}
              </MenuItem>
              <MenuItem onClick={() => callback('IMPORT_EXAMPLE_PROMARK_MOPA_60W_COLOR')}>
                {menuCms.import_promark_mopa_60w_color}
              </MenuItem>
              <MenuItem onClick={() => callback('IMPORT_EXAMPLE_PROMARK_MOPA_60W_COLOR_2')}>
                {`${menuCms.import_promark_mopa_60w_color} - 2`}
              </MenuItem>
              <MenuItem onClick={() => callback('IMPORT_EXAMPLE_PROMARK_MOPA_100W_COLOR')}>
                {menuCms.import_promark_mopa_100w_color}
              </MenuItem>
              <MenuItem onClick={() => callback('IMPORT_EXAMPLE_PROMARK_MOPA_100W_COLOR_2')}>
                {`${menuCms.import_promark_mopa_100w_color} - 2`}
              </MenuItem>
            </SubMenu>
          )}
          <MenuItem onClick={() => callback('IMPORT_ACRYLIC_FOCUS_PROBE')}>
            {menuCms.import_acrylic_focus_probe}
          </MenuItem>
          <MenuItem onClick={() => callback('IMPORT_BEAMBOX_2_FOCUS_PROBE')}>
            {menuCms.import_beambox_2_focus_probe}
          </MenuItem>
        </SubMenu>
        <MenuDivider />
        <SubMenu label={menuCms.export_to}>
          <MenuItem onClick={() => callback('EXPORT_BVG')}>{menuCms.export_BVG}</MenuItem>
          <MenuItem onClick={() => callback('EXPORT_SVG')}>{menuCms.export_SVG}</MenuItem>
          <MenuItem onClick={() => callback('EXPORT_PNG')}>{menuCms.export_PNG}</MenuItem>
          <MenuItem onClick={() => callback('EXPORT_JPG')}>{menuCms.export_JPG}</MenuItem>
          <MenuItem onClick={() => callback('EXPORT_FLUX_TASK')}>{hotkey('export_flux_task')}</MenuItem>
          {isUvPrintFileEnabled && (
            <MenuItem onClick={() => callback('EXPORT_UV_PRINT')}>{menuCms.export_UV_print}</MenuItem>
          )}
        </SubMenu>
        <MenuDivider />
        <MenuItem onClick={() => callback('PREFERENCE')}>{hotkey('preferences')}</MenuItem>
      </SubMenu>
      <SubMenu label={menuCms.edit}>
        <MenuItem onClick={() => callback('UNDO')}>{hotkey('undo')}</MenuItem>
        <MenuItem onClick={() => callback('REDO')}>{hotkey('redo')}</MenuItem>
        <MenuDivider />
        <MenuItem onClick={() => callback('CUT')}>{hotkey('cut')}</MenuItem>
        <MenuItem onClick={() => callback('COPY')}>{hotkey('copy')}</MenuItem>
        <MenuItem onClick={() => callback('PASTE')}>{hotkey('paste')}</MenuItem>
        <MenuItem onClick={() => callback('PASTE_IN_PLACE')}>{hotkey('paste_in_place')}</MenuItem>
        <MenuItem disabled={duplicateDisabled} onClick={async () => callback('DUPLICATE')}>
          {hotkey('duplicate')}
        </MenuItem>
        <MenuDivider />
        <MenuItem disabled={groupDisabled} onClick={() => callback('GROUP')}>
          {hotkey('group')}
        </MenuItem>
        <MenuItem disabled={ungroupDisabled} onClick={() => callback('UNGROUP')}>
          {hotkey('ungroup')}
        </MenuItem>
        <MenuDivider />
        <SubMenu disabled={pathDisabled} label={menuCms.path}>
          <MenuItem onClick={() => callback('OFFSET')}>{menuCms.offset}</MenuItem>
          <MenuItem disabled={decomposePathDisabled} onClick={() => callback('DECOMPOSE_PATH')}>
            {menuCms.decompose_path}
          </MenuItem>
        </SubMenu>
        <SubMenu disabled={imageEditDisabled} label={menuCms.photo_edit}>
          <MenuItem onClick={() => callback('IMAGE_SHARPEN')}>{menuCms.image_sharpen}</MenuItem>
          <MenuItem onClick={() => callback('IMAGE_CROP')}>{menuCms.image_crop}</MenuItem>
          <MenuItem onClick={() => callback('IMAGE_INVERT')}>{menuCms.image_invert}</MenuItem>
          <MenuItem onClick={() => callback('IMAGE_STAMP')}>{lang.stamp_maker_panel.title}</MenuItem>
          <MenuItem onClick={() => callback('IMAGE_VECTORIZE')}>{menuCms.image_vectorize}</MenuItem>
          <MenuItem onClick={() => callback('IMAGE_CURVE')}>{menuCms.image_curve}</MenuItem>
        </SubMenu>
        <SubMenu disabled={svgEditDisabled} label={menuCms.svg_edit}>
          <MenuItem onClick={() => callback('DISASSEMBLE_USE')}>{menuCms.disassemble_use}</MenuItem>
        </SubMenu>
        <SubMenu label={menuCms.layer_setting}>
          <MenuItem onClick={() => callback('LAYER_COLOR_CONFIG')}>{menuCms.layer_color_config}</MenuItem>
        </SubMenu>
        <MenuDivider />
        <MenuItem onClick={() => callback('DOCUMENT_SETTING')}>{menuCms.document_setting}</MenuItem>
        <MenuItem onClick={() => callback('ROTARY_SETUP')}>{menuCms.rotary_setup}</MenuItem>
      </SubMenu>
      <SubMenu label={menuCms.view}>
        <MenuItem className="rc-menu__item--type-checkbox" onClick={() => callback('ZOOM_IN')}>
          {hotkey('zoom_in')}
        </MenuItem>
        <MenuItem className="rc-menu__item--type-checkbox" onClick={() => callback('ZOOM_OUT')}>
          {hotkey('zoom_out')}
        </MenuItem>
        <MenuItem className="rc-menu__item--type-checkbox" onClick={() => callback('FITS_TO_WINDOW')}>
          {menuCms.fit_to_window}
        </MenuItem>
        <MenuItem
          checked={shouldZoomWithWindow}
          onClick={() => {
            callback('ZOOM_WITH_WINDOW');
          }}
          type="checkbox"
        >
          {menuCms.zoom_with_window}
        </MenuItem>
        <MenuDivider />
        <MenuItem
          checked={shouldShowGrids}
          onClick={() => {
            callback('SHOW_GRIDS');
          }}
          type="checkbox"
        >
          {menuCms.show_grids}
        </MenuItem>
        <MenuItem
          checked={shouldShowRulers}
          onClick={() => {
            callback('SHOW_RULERS');
          }}
          type="checkbox"
        >
          {menuCms.show_rulers}
        </MenuItem>
        <MenuItem
          checked={shouldUseLayerColor}
          onClick={() => {
            callback('SHOW_LAYER_COLOR');
          }}
          type="checkbox"
        >
          {menuCms.show_layer_color}
        </MenuItem>
        <MenuItem
          checked={isAutoAlign}
          onClick={() => {
            callback('AUTO_ALIGN');
          }}
          type="checkbox"
        >
          {menuCms.auto_align}
        </MenuItem>
        <MenuItem
          checked={isUsingAntiAliasing}
          onClick={() => {
            callback('ANTI_ALIASING');
          }}
          type="checkbox"
        >
          {menuCms.anti_aliasing}
        </MenuItem>
      </SubMenu>
      <SubMenu label={menuCms.machines}>
        <MenuItem onClick={() => callback('ADD_NEW_MACHINE')}>{hotkey('add_new_machine')}</MenuItem>
        <MenuItem onClick={() => callback('NETWORK_TESTING')}>{menuCms.network_testing}</MenuItem>
        {deviceMenus()}
      </SubMenu>
      <SubMenu label={menuCms.tools.title}>
        <MenuItem onClick={() => callback('MATERIAL_TEST_GENERATOR')}>{menuCms.tools.material_test_generator}</MenuItem>
        <MenuItem onClick={() => callback('CODE_GENERATOR')}>{menuCms.tools.code_generator}</MenuItem>
        <MenuItem onClick={() => callback('BOX_GEN')}>{menuCms.tools.box_generator}</MenuItem>
        <MenuItem onClick={() => callback('START_CURVE_ENGRAVING_MODE')}>{tCurveEngraving.title}</MenuItem>
      </SubMenu>
      <SubMenu label={menuCms.account}>
        {email ? (
          <MenuItem onClick={() => callback('SIGN_OUT')}>{`${menuCms.logout} (${email})`}</MenuItem>
        ) : (
          <MenuItem onClick={() => callback('SIGN_IN')}>{menuCms.login_or_register}</MenuItem>
        )}
        <MenuItem onClick={() => openPage(menuCms.link.design_market)}>{menuCms.design_market}</MenuItem>
        <MenuItem disabled={email === null} onClick={() => callback('MANAGE_ACCOUNT')}>
          {menuCms.manage_account}
        </MenuItem>
      </SubMenu>
      <SubMenu label={menuCms.help}>
        <MenuItem onClick={() => callback('ABOUT_BEAM_STUDIO')}>{menuCms.about_beam_studio}</MenuItem>
        {!isMobile && <MenuItem onClick={() => callback('START_TUTORIAL')}>{menuCms.show_start_tutorial}</MenuItem>}
        {!isMobile && <MenuItem onClick={() => callback('START_UI_INTRO')}>{menuCms.show_ui_intro}</MenuItem>}
        <MenuItem onClick={() => callback('START_GESTURE_INTRO')}>{menuCms.show_gesture_tutorial}</MenuItem>
        <MenuItem onClick={() => callback('CHANGE_LOGS')}>{menuCms.change_logs}</MenuItem>
        <MenuItem onClick={() => openPage(menuCms.link.help_center)}>{menuCms.help_center}</MenuItem>
        <MenuItem onClick={() => openPage(menuCms.link.shortcuts)}>{menuCms.keyboard_shortcuts}</MenuItem>
        <MenuItem onClick={() => openPage(menuCms.link.contact_us)}>{menuCms.contact}</MenuItem>
        <MenuDivider />
        <MenuItem onClick={() => openPage(menuCms.link.forum)}>{menuCms.forum}</MenuItem>
        <MenuItem onClick={() => callback('FOLLOW_US')}>{menuCms.follow_us}</MenuItem>
      </SubMenu>
    </TopBarMenu>
  );
}
