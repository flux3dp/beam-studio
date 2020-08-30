import Control from "../helpers/api/control";
import Camera from "../helpers/api/camera";

export interface IDeviceInfo {
    ipaddr: string;
    st_id: number
    error_label: never
    uuid: string,
    model: string,
    version: string,
    password: boolean
    plaintext_password: string,
    serial: string,
    source: string,
    name: string,
    addr: string
}

export interface IDeviceConnection {
    info: IDeviceInfo,
    control: Control,
    errors: string[]
    camera: Camera
}