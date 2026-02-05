import storage from '@core/implementations/storage';

export type AlertConfigKey =
  | 'done-first-cali'
  | 'is-path-engine-dialog-shown'
  | 'skip-auto-feeder-instruction'
  | 'skip-fb-group-invitation'
  | 'skip-high-power-confirm'
  | 'skip-interface-tutorial'
  | 'skip-job-origin-warning'
  | 'skip-old-firmware-hint-2'
  | 'skip-social-media-invitation'
  | 'skip-svg-import-warning'
  | 'skip-switch-to-laser-module'
  | 'skip-switch-to-printer-module'
  | 'skip-z-speed-test-info'
  | 'skip_auto_focus_warning'
  | 'skip_bg_removal_warning'
  | 'skip_camera_cable_alert'
  | 'skip_check_thumbnail_warning'
  | 'skip_curve_speed_limit_warning'
  | 'skip_dxf_oversize_warning'
  | 'skip_dxf_version_warning'
  | 'skip_image_path_warning'
  | 'skip_os_version_warning'
  | 'skip_path_speed_constraint_warning'
  | 'skip_path_speed_warning'
  | 'skip_svg_version_warning'
  | 'skip_variable_text_warning';

const alertConfig = {
  read: (key: AlertConfigKey) => {
    const config = storage.get('alert-config') || {};

    return config[key];
  },
  write: (key: AlertConfigKey, value: any): void => {
    const config = storage.get('alert-config') || {};

    config[key] = value;
    storage.set('alert-config', config);
  },
};

export default alertConfig;
