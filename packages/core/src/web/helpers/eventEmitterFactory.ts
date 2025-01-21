import { EventEmitter } from 'eventemitter3';

const eventEmitters: Record<string, any> = {
  'alert-progress': null,
  'beambox-preference': null,
  canvas: null,
  'flux-id': null,
  'layer-panel': null,
  monitor: null,
  'object-panel': null,
  'right-panel': null,
  'time-estimation-button': null,
  'top-bar': null,
  'top-bar-hints': null,
  'top-bar-menu': null,
  workarea: null,
  'zoom-block': null,
};

export default {
  createEventEmitter: (type?: string): EventEmitter => {
    if (!type) {
      return new EventEmitter();
    }

    if (!eventEmitters[type as keyof typeof eventEmitters]) {
      eventEmitters[type as keyof typeof eventEmitters] = new EventEmitter();
    }

    return eventEmitters[type as keyof typeof eventEmitters] as unknown as EventEmitter;
  },
};
