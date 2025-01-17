/* eslint-disable @typescript-eslint/no-shadow */
import React, { useState } from 'react';
import { Menu as TopBarMenu, MenuItem, MenuDivider, SubMenu } from '@szhsin/react-menu';

import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import browser from 'implementations/browser';
import { promarkModels } from 'app/actions/beambox/constant';
import Discover from 'helpers/api/discover';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import { menuItems } from 'app/constants/menuItems';
import useI18n from 'helpers/useI18n';
import { IDeviceInfo } from 'interfaces/IDevice';
import { modelsWithModules } from 'app/constants/layer-module/layer-modules';
import { useIsMobile } from 'helpers/system-helper';
import isWeb from 'helpers/is-web';

interface Props {
  email: string;
}

let discover;

export default function Menu({ email }: Props): JSX.Element {
  const eventEmitter = React.useMemo(
    () => eventEmitterFactory.createEventEmitter('top-bar-menu'),
    []
  );
  const [devices, setDevices] = useState(Array<IDeviceInfo>());
  const [shouldShowRulers, changeShouldShowRulers] = useState(
    BeamboxPreference.read('show_rulers')
  );
  const [shouldShowGrids, changeShouldShowGrids] = useState(BeamboxPreference.read('show_grids'));
  const [shouldUseLayerColor, changeShouldUseLayerColor] = useState(
    BeamboxPreference.read('use_layer_color')
  );
  const [isUsingAntiAliasing, setIsUsingAntiAliasing] = useState(
    BeamboxPreference.read('anti-aliasing')
  );
  const [shouldAlignToEdges, changeShouldAlignToEdges] = useState(
    BeamboxPreference.read('show_align_lines')
  );
  const [shouldZoomWithWindow, changeShouldZoomWithWindow] = useState(
    BeamboxPreference.read('zoom_with_window')
  );
  const [duplicateDisabled, setDuplicateDisabled] = useState(true);
  const [svgEditDisabled, setSvgEditDisabled] = useState(true);
  const [decomposePathDisabled, setDecomposePathDisabled] = useState(true);
  const [groupDisabled, setGroupDisabled] = useState(true);
  const [ungroupDisabled, setUngroupDisabled] = useState(true);
  const [pathDisabled, setPathDisabled] = useState(true);
  const [imageEditDisabled, setImageEditDisabled] = useState(true);
  const menuItemUpdater = {
    DUPLICATE: setDuplicateDisabled,
    SVG_EDIT: setSvgEditDisabled,
    DECOMPOSE_PATH: setDecomposePathDisabled,
    GROUP: setGroupDisabled,
    UNGROUP: setUngroupDisabled,
    PATH: setPathDisabled,
    PHOTO_EDIT: setImageEditDisabled,
  };
  const isMobile = useIsMobile();

  React.useEffect(() => {
    eventEmitter.on('ENABLE_MENU_ITEM', (items: string[]) => {
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        menuItemUpdater[item]?.(false);
      }
    });

    eventEmitter.on('DISABLE_MENU_ITEM', (items: string[]) => {
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        menuItemUpdater[item]?.(true);
      }
    });

    return () => {
      eventEmitter.removeListener('ENABLE_MENU_ITEM');
      eventEmitter.removeListener('DISABLE_MENU_ITEM');
    };
  });

  React.useEffect(() => {
    discover = Discover('top-bar-menu', (newDevices: IDeviceInfo[]) => {
      newDevices.sort((a, b) => (a.name >= b.name ? 1 : -1));

      if (newDevices.map((d) => d.name).join('') !== devices.map((d) => d.name).join('')) {
        setDevices(newDevices);
      }
    });

    return () => {
      discover.removeListener('top-bar-menu');
    };
  }, [devices]);

  const {
    topbar: { menu: menuCms },
    promark_settings: tPromarkSettings,
  } = useI18n();
  const callback = (id: string, device?: IDeviceInfo) => {
    eventEmitter.emit('MENU_CLICK', null, {
      id,
      serial: device?.serial,
      machineName: device?.name,
      uuid: device?.uuid,
    });
  };
  const openPage = (url: string) => browser.open(url);
  const hotkey = (action: string): JSX.Element => (
    <>
      <span className="action">{menuCms[action]}</span>
      <span className="hotkey">{menuItems[action].representation}</span>
    </>
  );

  const deviceMenus = () => {
    const submenus = [];

    for (let i = 0; i < devices.length; i += 1) {
      const { model, name, serial } = devices[i];
      const hasModules = modelsWithModules.has(model);
      const isPromark = promarkModels.has(model);
      const isBb2 = model === 'fbb2';

      // Note: SubMenu doesn't support a React.Fragment wrapper (<>...</>) as a child.
      submenus.push(
        <SubMenu label={name} key={serial}>
          <MenuItem onClick={() => callback('DASHBOARD', devices[i])}>{menuCms.dashboard}</MenuItem>
          <MenuItem onClick={() => callback('MACHINE_INFO', devices[i])}>
            {menuCms.machine_info}
          </MenuItem>
          {isPromark && (
            <MenuItem onClick={() => callback('PROMARK_SETTINGS', devices[i])}>
              {tPromarkSettings.title}
            </MenuItem>
          )}
          {isPromark && (
            <MenuItem onClick={() => callback('Z_AXIS_ADJUSTMENT', devices[i])}>
              {tPromarkSettings.z_axis_adjustment.title}
            </MenuItem>
          )}
          <MenuDivider />
          <SubMenu label={menuCms.calibration}>
            <MenuItem
              onClick={() => callback('CALIBRATE_BEAMBOX_CAMERA', devices[i])}
              disabled={isMobile}
            >
              {menuCms.calibrate_beambox_camera} {isMobile && '(PC Only)'}
            </MenuItem>
            {isBb2 && (
              <MenuItem
                onClick={() => callback('CALIBRATE_CAMERA_ADVANCED', devices[i])}
                disabled={isMobile}
              >
                {menuCms.calibrate_camera_advanced} {isMobile && '(PC Only)'}
              </MenuItem>
            )}
            {hasModules && (
              <MenuItem
                onClick={() => callback('CALIBRATE_PRINTER_MODULE', devices[i])}
                disabled={isMobile}
              >
                {menuCms.calibrate_printer_module}
              </MenuItem>
            )}
            {hasModules && (
              <MenuItem
                onClick={() => callback('CALIBRATE_IR_MODULE', devices[i])}
                disabled={isMobile}
              >
                {menuCms.calibrate_ir_module}
              </MenuItem>
            )}
            {model === 'fbm1' && (
              <MenuItem
                onClick={() => callback('CALIBRATE_BEAMBOX_CAMERA_BORDERLESS', devices[i])}
                disabled={isMobile}
              >
                {menuCms.calibrate_beambox_camera_borderless} {isMobile && '(PC Only)'}
              </MenuItem>
            )}
            {model === 'fbm1' && (
              <MenuItem
                onClick={() => callback('CALIBRATE_DIODE_MODULE', devices[i])}
                disabled={isMobile}
              >
                {menuCms.calibrate_diode_module} {isMobile && '(PC Only)'}
              </MenuItem>
            )}
          </SubMenu>
          <MenuDivider />
          <MenuItem onClick={() => callback('UPDATE_FIRMWARE', devices[i])}>
            {menuCms.update_firmware}
          </MenuItem>
          <SubMenu label={menuCms.download_log}>
            <MenuItem onClick={() => callback('LOG_NETWORK', devices[i])}>
              {menuCms.log.network}
            </MenuItem>
            <MenuItem onClick={() => callback('LOG_HARDWARE', devices[i])}>
              {menuCms.log.hardware}
            </MenuItem>
            <MenuItem onClick={() => callback('LOG_DISCOVER', devices[i])}>
              {menuCms.log.discover}
            </MenuItem>
            <MenuItem onClick={() => callback('LOG_USB', devices[i])}>{menuCms.log.usb}</MenuItem>
            <MenuItem onClick={() => callback('LOG_USBLIST', devices[i])}>
              {menuCms.log.usblist}
            </MenuItem>
            <MenuItem onClick={() => callback('LOG_CAMERA', devices[i])}>
              {menuCms.log.camera}
            </MenuItem>
            <MenuItem onClick={() => callback('LOG_CLOUD', devices[i])}>
              {menuCms.log.cloud}
            </MenuItem>
            <MenuItem onClick={() => callback('LOG_PLAYER', devices[i])}>
              {menuCms.log.player}
            </MenuItem>
            <MenuItem onClick={() => callback('LOG_ROBOT', devices[i])}>
              {menuCms.log.robot}
            </MenuItem>
          </SubMenu>
        </SubMenu>
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
            <MenuItem onClick={() => callback('IMPORT_EXAMPLE')}>
              {menuCms.import_hello_beamo}
            </MenuItem>
            <MenuItem onClick={() => callback('IMPORT_HELLO_BEAMBOX')}>
              {menuCms.import_hello_beambox}
            </MenuItem>
            {!isWeb() && (
              <MenuItem onClick={() => callback('IMPORT_EXAMPLE_BEAMBOX_2')}>
                {menuCms.import_beambox_2_example}
              </MenuItem>
            )}
            <MenuItem onClick={() => callback('IMPORT_EXAMPLE_HEXA')}>
              {menuCms.import_hexa_example}
            </MenuItem>
            {!isWeb() && (
              <MenuItem onClick={() => callback('IMPORT_EXAMPLE_PROMARK')}>
                {menuCms.import_promark_example}
              </MenuItem>
            )}
          </SubMenu>
          <SubMenu label={menuCms.material_test}>
            <MenuItem onClick={() => callback('IMPORT_MATERIAL_TESTING_ENGRAVE')}>
              {menuCms.import_material_testing_engrave}
            </MenuItem>
            {!isWeb() && (
              <MenuItem onClick={() => callback('IMPORT_MATERIAL_TESTING_ENGRAVE_BEAMBOX_2')}>
                {menuCms.import_material_testing_engrave}
              </MenuItem>
            )}
            <MenuItem onClick={() => callback('IMPORT_MATERIAL_TESTING_OLD')}>
              {menuCms.import_material_testing_old}
            </MenuItem>
            <MenuItem onClick={() => callback('IMPORT_MATERIAL_TESTING_CUT')}>
              {menuCms.import_material_testing_cut}
            </MenuItem>
            {!isWeb() && (
              <MenuItem onClick={() => callback('IMPORT_MATERIAL_TESTING_CUT_BEAMBOX_2')}>
                {menuCms.import_material_testing_cut}
              </MenuItem>
            )}
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
          {!isWeb() && (
            <MenuItem onClick={() => callback('IMPORT_BEAMBOX_2_FOCUS_PROBE')}>
              {menuCms.import_beambox_2_focus_probe}
            </MenuItem>
          )}
        </SubMenu>
        <MenuDivider />
        <SubMenu label={menuCms.export_to}>
          <MenuItem onClick={() => callback('EXPORT_BVG')}>{menuCms.export_BVG}</MenuItem>
          <MenuItem onClick={() => callback('EXPORT_SVG')}>{menuCms.export_SVG}</MenuItem>
          <MenuItem onClick={() => callback('EXPORT_PNG')}>{menuCms.export_PNG}</MenuItem>
          <MenuItem onClick={() => callback('EXPORT_JPG')}>{menuCms.export_JPG}</MenuItem>
          <MenuItem onClick={() => callback('EXPORT_FLUX_TASK')}>
            {hotkey('export_flux_task')}
          </MenuItem>
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
          <MenuItem onClick={() => callback('IMAGE_STAMP')}>{menuCms.image_stamp}</MenuItem>
          <MenuItem onClick={() => callback('IMAGE_VECTORIZE')}>{menuCms.image_vectorize}</MenuItem>
          <MenuItem onClick={() => callback('IMAGE_CURVE')}>{menuCms.image_curve}</MenuItem>
        </SubMenu>
        <SubMenu disabled={svgEditDisabled} label={menuCms.svg_edit}>
          <MenuItem onClick={() => callback('DISASSEMBLE_USE')}>{menuCms.disassemble_use}</MenuItem>
        </SubMenu>
        <SubMenu label={menuCms.layer_setting}>
          <MenuItem onClick={() => callback('LAYER_COLOR_CONFIG')}>
            {menuCms.layer_color_config}
          </MenuItem>
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
        <MenuItem
          className="rc-menu__item--type-checkbox"
          onClick={() => callback('FITS_TO_WINDOW')}
        >
          {menuCms.fit_to_window}
        </MenuItem>
        <MenuItem
          type="checkbox"
          onClick={() => {
            callback('ZOOM_WITH_WINDOW');
            changeShouldZoomWithWindow(!shouldZoomWithWindow);
          }}
          checked={shouldZoomWithWindow}
        >
          {menuCms.zoom_with_window}
        </MenuItem>
        <MenuDivider />
        <MenuItem
          type="checkbox"
          onClick={() => {
            callback('SHOW_GRIDS');
            changeShouldShowGrids(!shouldShowGrids);
          }}
          checked={shouldShowGrids}
        >
          {menuCms.show_grids}
        </MenuItem>
        <MenuItem
          type="checkbox"
          onClick={() => {
            callback('SHOW_RULERS');
            changeShouldShowRulers(!shouldShowRulers);
          }}
          checked={shouldShowRulers}
        >
          {menuCms.show_rulers}
        </MenuItem>
        <MenuItem
          type="checkbox"
          onClick={() => {
            callback('SHOW_LAYER_COLOR');
            changeShouldUseLayerColor(!shouldUseLayerColor);
          }}
          checked={shouldUseLayerColor}
        >
          {menuCms.show_layer_color}
        </MenuItem>
        <MenuItem
          type="checkbox"
          onClick={() => {
            callback('ALIGN_TO_EDGES');
            changeShouldAlignToEdges(!shouldAlignToEdges);
          }}
          checked={shouldAlignToEdges}
        >
          {menuCms.align_to_edges}
        </MenuItem>
        <MenuItem
          type="checkbox"
          onClick={() => {
            callback('ANTI_ALIASING');
            setIsUsingAntiAliasing(!isUsingAntiAliasing);
          }}
          checked={isUsingAntiAliasing}
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
        <MenuItem onClick={() => callback('MATERIAL_TEST_GENERATOR')}>
          {menuCms.tools.material_test_generator}
        </MenuItem>
        <MenuItem onClick={() => callback('CODE_GENERATOR')}>
          {menuCms.tools.code_generator}
        </MenuItem>
        <MenuItem onClick={() => callback('BOX_GEN')}>{menuCms.tools.box_generator}</MenuItem>
      </SubMenu>
      <SubMenu label={menuCms.account}>
        {email == null ? (
          <MenuItem onClick={() => callback('SIGN_IN')}>{menuCms.sign_in}</MenuItem>
        ) : (
          <MenuItem
            onClick={() => callback('SIGN_OUT')}
          >{`${menuCms.sign_out} (${email})`}</MenuItem>
        )}
        <MenuItem onClick={() => openPage(menuCms.link.design_market)}>
          {menuCms.design_market}
        </MenuItem>
        <MenuItem disabled={email === null} onClick={() => callback('MANAGE_ACCOUNT')}>
          {menuCms.manage_account}
        </MenuItem>
      </SubMenu>
      <SubMenu label={menuCms.help}>
        <MenuItem onClick={() => callback('ABOUT_BEAM_STUDIO')}>
          {menuCms.about_beam_studio}
        </MenuItem>
        {!isMobile && (
          <MenuItem onClick={() => callback('START_TUTORIAL')}>
            {menuCms.show_start_tutorial}
          </MenuItem>
        )}
        {!isMobile && (
          <MenuItem onClick={() => callback('START_UI_INTRO')}>{menuCms.show_ui_intro}</MenuItem>
        )}
        <MenuItem onClick={() => callback('START_GESTURE_INTRO')}>
          {menuCms.show_gesture_tutorial}
        </MenuItem>
        <MenuItem onClick={() => callback('QUESTIONNAIRE')}>{menuCms.questionnaire}</MenuItem>
        <MenuItem onClick={() => callback('CHANGE_LOGS')}>{menuCms.change_logs}</MenuItem>
        <MenuItem onClick={() => openPage(menuCms.link.help_center)}>
          {menuCms.help_center}
        </MenuItem>
        <MenuItem onClick={() => openPage(menuCms.link.shortcuts)}>
          {menuCms.keyboard_shortcuts}
        </MenuItem>
        <MenuItem onClick={() => openPage(menuCms.link.contact_us)}>{menuCms.contact}</MenuItem>
        <MenuDivider />
        <MenuItem onClick={() => openPage(menuCms.link.forum)}>{menuCms.forum}</MenuItem>
        <MenuItem onClick={() => callback('FOLLOW_US')}>{menuCms.follow_us}</MenuItem>
      </SubMenu>
    </TopBarMenu>
  );
}
