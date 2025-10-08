import type { WorkAreaModel } from '@core/app/constants/workarea-constants';

import type Camera from '../helpers/api/camera';

import type IControlSocket from './IControlSocket';

export type FirmwareType = FirmwareType;

export interface IDeviceInfo {
  addr: string;
  alive: boolean;
  error_label: never;
  ipaddr: string;
  lastAlive?: number;
  model: WorkAreaModel;
  name: string;
  password: boolean;
  plaintext_password: string;
  serial: string;
  source: string;
  st_id: number;
  st_prog?: number;
  uuid: string;
  version: string;
}

export interface IDeviceConnection {
  camera: Camera | null;
  cameraNeedsFlip: boolean | null;
  control: IControlSocket | null;
  errors: null | string[];
  info: IDeviceInfo;
}

export interface IReport {
  Beam_Air: number;
  disconnection?: number; // promark
  error: string[];
  laser_pwr: number;
  prog: number;
  raw_laser: number;
  session?: number;
  st_id: number;
  st_label: string;
  traveled: number;
}

export interface IDeviceDetailInfo {
  head_submodule_info: string;
  head_type: string;
  // detect if the probe is showing for Beambox II
  probe_showed: '0' | '1';
  x_acc: string;
}

export interface IConfigSetting {
  max: number;
  min: number;
  step: number;
  value: number;
}
