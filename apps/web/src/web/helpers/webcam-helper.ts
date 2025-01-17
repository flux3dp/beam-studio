import communicator from 'implementations/communicator';
import i18n from 'helpers/i18n';
import isWeb from 'helpers/is-web';

import { selectUsbDevice } from 'app/components/dialogs/UsbDeviceSelector';

const askForPermission = async (): Promise<boolean> => {
  if (isWeb()) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      return true;
    } catch (error) {
      return false;
    }
  }
  const res = communicator.sendSync('ASK_FOR_PERMISSION', 'camera');
  return res;
};

const listDevices = async (): Promise<MediaDeviceInfo[]> => {
  let devices = await navigator.mediaDevices.enumerateDevices();
  devices = devices.filter(
    (device) => device.kind === 'videoinput' && device.label.startsWith('USB')
  );
  return devices;
};

const getDevice = async (id?: string): Promise<MediaDeviceInfo> => {
  const devices = await listDevices();
  if (devices.length === 0) return null;
  if (devices.length === 1) return devices[0];
  if (id) {
    const device = devices.find((val) => val.deviceId === id);
    if (device) return device;
  }
  return selectUsbDevice(devices, listDevices);
};

export class WebCamConnection {
  private video: HTMLVideoElement;
  private stream: MediaStream;
  private device: MediaDeviceInfo;
  private width: number;
  private height: number;
  private reconnectInterval: NodeJS.Timeout;
  private ended = false;

  /**
   *
   * @param opts
   * @param opts.video - The video element to display the webcam feed
   * @param opts.deviceId - The device ID of the webcam to connect to,
   *  if not provided, the user will be prompted to select a device
   * @param opts.width - The width of the video feed
   * @param opts.height - The height of the video feed
   */
  constructor({
    video,
    width = 2400,
    height = 1600,
  }: {
    video?: HTMLVideoElement;
    width?: number;
    height?: number;
  }) {
    this.video = video || document.createElement('video');
    this.width = width;
    this.height = height;
  }

  connect = async (deviceId: string = this.device?.deviceId): Promise<boolean> => {
    const t = i18n.lang.web_cam;
    const permission = await askForPermission();
    if (!permission) {
      throw new Error(t.no_permission);
    }
    const device = await getDevice(deviceId);
    if (!device) {
      throw new Error(t.no_device);
    }
    this.device = device;
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: device.deviceId, width: this.width, height: this.height },
    });
    if (!this.stream) return false;
    const videoTracks = this.stream.getVideoTracks();
    if (videoTracks.length === 0) return false;
    videoTracks[0].addEventListener('ended', () => {
      console.log('Camera stream ended');
      this.disconnectWebcam();
      if (!this.ended) {
        this.connect(this.device.deviceId);
        this.reconnectInterval = setInterval(() => {
          this.connect(this.device.deviceId);
        }, 3000);
      }
    });
    this.video.srcObject = this.stream;
    await this.video.play();
    clearInterval(this.reconnectInterval);
    return true;
  };

  getPicture = async ({ flip = true }: { flip?: boolean } = {}): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    canvas.width = this.video.videoWidth;
    canvas.height = this.video.videoHeight;
    const context = canvas.getContext('2d');
    if (flip) {
      context.save();
      context.translate(canvas.width, canvas.height);
      context.scale(-1, -1);
    }
    context.drawImage(this.video, 0, 0, canvas.width, canvas.height);
    context.restore();
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      });
    });
  };

  disconnectWebcam = (): void => {
    this.video.pause();
    this.stream?.getTracks().forEach((track) => {
      track.stop();
    });
    this.video.srcObject = null;
  };

  end = (): void => {
    this.ended = true;
    clearInterval(this.reconnectInterval);
    this.disconnectWebcam();
  };
}

const connectWebcam = async (
  opts: {
    video?: HTMLVideoElement;
    deviceId?: string;
    width?: number;
    height?: number;
    timeout?: number;
  } = {}
): Promise<WebCamConnection> => {
  const { timeout = 5000 } = opts;
  const connection = new WebCamConnection(opts);
  const start = Date.now();
  let error: Error;
  while (Date.now() - start < timeout) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const res = await connection.connect(opts.deviceId);
      if (res) return connection;
    } catch (err) {
      console.error(err);
      error = err;
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  connection.end();
  if (error) throw error;
  return null;
};

export default { connectWebcam, getDevice };
