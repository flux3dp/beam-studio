const mockSend = jest.fn();

// p-queue is ESM-only; the spec needs no serialisation, so run each task at once
jest.mock('p-queue', () => ({
  __esModule: true,
  default: class {
    add = (task: () => unknown) => task();
  },
}));
jest.mock('@core/helpers/websocket', () => jest.fn());
jest.mock('@core/helpers/rsa-key', () => jest.fn(() => 'pem'));
jest.mock('@core/helpers/version-checker', () => jest.fn());
jest.mock('@core/helpers/i18n', () => ({ lang: { message: { camera: {}, connectingCamera: 'connecting' } } }));
jest.mock('@core/app/actions/progress-caller', () => ({
  checkIdExist: jest.fn(),
  openNonstopProgress: jest.fn(),
  popById: jest.fn(),
}));
jest.mock('@core/app/actions/beambox/constant', () => ({
  default: {},
  fisheyeModels: new Set(),
  legacyBeamSeriesModels: new Set(),
}));

import Camera from './camera';

/** A Camera with a fake socket: messages are pushed through `receive`, sent commands land in mockSend */
const setup = () => {
  const camera = new Camera(false, false);
  const subject = (camera as any).wsSubject;

  (camera as any).ws = { send: mockSend };
  camera.preprocessImage = jest.fn(async (blob: Blob) => blob);

  return { camera, receive: (msg: unknown) => subject.next(msg) };
};

describe('Camera', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // checkBlobIsImage loads the blob into an Image; jsdom never fires onload, so fake one that does
    global.URL.createObjectURL = jest.fn(() => 'blob:url');
    global.URL.revokeObjectURL = jest.fn();
    (global as any).Image = class {
      onload: (() => void) | null = null;
      set src(_value: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    };
  });

  describe('oneShot', () => {
    test('attaches the pose message that preceded the frame', async () => {
      const { camera, receive } = setup();
      const shot = camera.oneShot(false);
      const pose = { expected_left: 2, expected_right: -2, left: 1.9, ok: true, right: -2.1 };

      expect(mockSend).toHaveBeenCalledWith('require_frame');
      receive({ pose, status: 'frame' });
      receive(new Blob(['jpeg']));
      await expect(shot).resolves.toEqual({ imgBlob: expect.any(Blob), needCameraCableAlert: false, pose });
    });

    test('has no pose without the message, and a pose is consumed by the frame that follows it', async () => {
      const { camera, receive } = setup();
      const first = camera.oneShot(false);

      receive({ pose: { ok: true }, status: 'frame' });
      receive(new Blob(['jpeg']));
      expect(await first).toHaveProperty('pose');

      const second = camera.oneShot(false);

      receive(new Blob(['jpeg']));
      expect(await second).not.toHaveProperty('pose');
    });

    test('a pose received before the request still pairs with the next frame only', async () => {
      const { camera, receive } = setup();

      // fluxghost sends the message right before its frame; the request timing does not matter
      receive({ pose: { ok: false }, status: 'frame' });

      const shot = camera.oneShot(false);

      receive(new Blob(['jpeg']));
      expect((await shot).pose).toEqual({ ok: false });
    });
  });

  describe('setPoseCheck', () => {
    test('sends set_pose_check and reads the reply', async () => {
      const { camera, receive } = setup();
      const enabling = camera.setPoseCheck(true, 2);

      await Promise.resolve();
      expect(mockSend).toHaveBeenCalledWith('set_pose_check {"enabled":true,"tolerance_deg":2}');
      receive({ status: 'ok' });
      await expect(enabling).resolves.toBe(true);

      const disabling = camera.setPoseCheck(false);

      await Promise.resolve();
      expect(mockSend).toHaveBeenLastCalledWith('set_pose_check {"enabled":false}');
      receive({ error: ['No fisheye params'], status: 'error' });
      await expect(disabling).resolves.toBe(false);
    });
  });
});
