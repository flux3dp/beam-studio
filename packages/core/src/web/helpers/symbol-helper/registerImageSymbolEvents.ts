import { funnel } from 'remeda';

import eventEmitterFactory from '../eventEmitterFactory';

import symbolMaker from './symbolMaker';

export const registerImageSymbolEvents = () => {
  const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');
  const handler = funnel(() => symbolMaker.reRenderAllImageSymbols(), {
    minQuietPeriodMs: 1000,
    triggerAt: 'end',
  });

  canvasEvents.on('zoom-changed', handler.call);
};

export default registerImageSymbolEvents;
