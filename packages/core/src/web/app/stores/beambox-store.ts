import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

const SHOW_CROPPER = 'SHOW_CROPPER';

const eventEmitter = eventEmitterFactory.createEventEmitter();

export default {
  emitShowCropper(): void {
    eventEmitter.emit(SHOW_CROPPER);
  },

  onCropperShown(callback: () => void): void {
    eventEmitter.on(SHOW_CROPPER, callback);
  },

  removeCropperShownListener(callback): void {
    eventEmitter.removeListener(SHOW_CROPPER, callback);
  },
};
