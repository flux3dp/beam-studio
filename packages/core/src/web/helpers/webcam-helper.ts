import { selectUsbDevice } from '@core/app/components/dialogs/UsbDeviceSelector';
import { MiscEvents } from '@core/app/constants/ipcEvents';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import communicator from '@core/implementations/communicator';

const askForPermission = async (): Promise<boolean> => {
  if (isWeb()) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      stream.getTracks().forEach((track) => {
        track.stop();
      });

      return true;
    } catch {
      return false;
    }
  }

  const res = communicator.sendSync(MiscEvents.AskForPermission, 'camera');

  return res;
};

const listDevices = async (): Promise<MediaDeviceInfo[]> => {
  let devices = await navigator.mediaDevices.enumerateDevices();

  const videoInputDevices = devices.filter((device) => device.kind === 'videoinput');
  const usbVideoInputDevices = videoInputDevices.filter((device) => device.label.includes('USB'));

  return usbVideoInputDevices.length ? usbVideoInputDevices : videoInputDevices;
};

const getDevice = async (id?: string): Promise<MediaDeviceInfo | null> => {
  const devices = await listDevices();

  if (devices.length === 0) return null;

  if (devices.length === 1) {
    return devices[0];
  }

  if (id) {
    const device = devices.find((val) => val.deviceId === id);

    if (device) {
      return device;
    }
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
  constructor({ height = 1600, video, width = 2400 }: { height?: number; video?: HTMLVideoElement; width?: number }) {
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
      video: { deviceId: device.deviceId, height: this.height, width: this.width },
    });

    if (!this.stream) {
      return false;
    }

    const videoTracks = this.stream.getVideoTracks();

    if (videoTracks.length === 0) {
      return false;
    }

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

    const context = canvas.getContext('2d')!;

    if (flip) {
      context.save();
      context.translate(canvas.width, canvas.height);
      context.scale(-1, -1);
    }

    context.drawImage(this.video, 0, 0, canvas.width, canvas.height);
    context.restore();

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      });
    });
  };

  switchVideo = (newVideo: HTMLVideoElement): void => {
    if (newVideo === this.video) return;

    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
    }

    this.video = newVideo;
    this.video.srcObject = this.stream;
    this.video.play();
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
    deviceId?: string;
    height?: number;
    timeout?: number;
    video?: HTMLVideoElement;
    width?: number;
  } = {},
): Promise<null | WebCamConnection> => {
  const { timeout = 5000 } = opts;
  const connection = new WebCamConnection(opts);
  const start = Date.now();
  let error: Error | undefined = undefined;

  while (Date.now() - start < timeout) {
    try {
      const res = await connection.connect(opts.deviceId);

      if (res) {
        return connection;
      }
    } catch (err) {
      console.error(err);
      error = err as Error;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  connection.end();

  if (error) {
    throw error;
  }

  return null;
};

export default { connectWebcam, getDevice };
