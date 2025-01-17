import storage from 'implementations/storage';

export type AlertConfigKey =
  | 'skip-interface-tutorial'
  | 'skip_os_version_warning'
  | 'skip_check_thumbnail_warning'
  | 'skip_camera_cable_alert'
  | 'skip_dxf_version_warning'
  | 'skip_dxf_oversize_warning'
  | 'skip_path_speed_warning'
  | 'skip_path_speed_constraint_warning'
  | 'skip_svg_version_warning'
  | 'skip_image_path_warning'
  | 'skip-fb-group-invitation'
  | 'skip_bg_removal_warning'
  | 'skip-old-firmware-hint-2'
  | 'skip-switch-to-printer-module'
  | 'skip-switch-to-laser-module'
  | 'done-first-cali'
  | 'skip-high-power-confirm'
  | 'skip-job-origin-warning';

export default {
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
