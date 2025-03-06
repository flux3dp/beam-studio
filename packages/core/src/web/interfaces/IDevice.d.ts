import type { WorkAreaModel } from '@core/app/constants/workarea-constants';

import type Camera from '../helpers/api/camera';

import type IControlSocket from './IControlSocket';

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
  camera: Camera;
  cameraNeedsFlip: boolean;
  control: IControlSocket;
  errors: string[];
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
  x_acc: string;
}

export interface IConfigSetting {
  max: number;
  min: number;
  step: number;
  value: number;
}
