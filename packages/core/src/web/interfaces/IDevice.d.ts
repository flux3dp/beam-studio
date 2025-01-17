import { WorkAreaModel } from 'app/constants/workarea-constants';

import Camera from '../helpers/api/camera';
// eslint-disable-next-line import/no-cycle
import IControlSocket from './IControlSocket';

export interface IDeviceInfo {
  alive: boolean;
  lastAlive?: number;
  ipaddr: string;
  st_id: number;
  error_label: never;
  uuid: string;
  model: WorkAreaModel;
  version: string;
  password: boolean;
  plaintext_password: string;
  serial: string;
  source: string;
  name: string;
  addr: string;
  st_prog?: number;
}

export interface IDeviceConnection {
  info: IDeviceInfo;
  control: IControlSocket;
  errors: string[];
  camera: Camera;
  cameraNeedsFlip: boolean;
}

export interface IReport {
  session?: number;
  st_id: number;
  st_label: string;
  error: string[];
  prog: number;
  traveled: number;
  laser_pwr: number;
  raw_laser: number;
  Beam_Air: number;
}

export interface IDeviceDetailInfo {
  head_submodule_info: string;
  x_acc: string;
  head_type: string;
}

export interface IConfigSetting {
  min: number;
  max: number;
  value: number;
  step: number;
}
