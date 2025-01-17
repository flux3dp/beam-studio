import eventEmitterFactory from 'helpers/eventEmitterFactory';

const SHOW_CROPPER = 'SHOW_CROPPER';
const DRAW_GUIDE_LINES = 'DRAW_GUIDE_LINES';

const eventEmitter = eventEmitterFactory.createEventEmitter();
export default {
  onCropperShown(callback: () => void): void {
    eventEmitter.on(SHOW_CROPPER, callback);
  },

  onDrawGuideLines(callback): void {
    eventEmitter.on(DRAW_GUIDE_LINES, callback);
  },

  removeCropperShownListener(callback): void {
    eventEmitter.removeListener(SHOW_CROPPER, callback);
  },

  emitShowCropper(): void {
    eventEmitter.emit(SHOW_CROPPER);
  },

  emitDrawGuideLines(): void {
    eventEmitter.emit(DRAW_GUIDE_LINES);
  },
};
