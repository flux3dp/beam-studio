import { match, P } from 'ts-pattern';

import { CanvasMode } from '@core/app/constants/canvasMode';
import deviceMaster from '@core/helpers/device-master';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import { useCanvasStore } from '../canvasStore';

import { setMouseMode } from './mouseMode';

export const toggleAutoFocus = async (forceState?: boolean) => {
  const workarea = document.getElementById('workarea');
  const workareaEvents = eventEmitterFactory.createEventEmitter('workarea');
  const { mode, setMode } = useCanvasStore.getState();
  const contextMenuHandler = (e: Event): void => {
    e.stopPropagation();
    e.preventDefault();
    toggleAutoFocus(false);
  };

  await match({ forceState, mode })
    .with(P.union({ forceState: true }, { forceState: undefined, mode: P.not(CanvasMode.AutoFocus) }), () => {
      workareaEvents.emit('update-context-menu', { menuDisabled: true });
      workarea?.addEventListener('contextmenu', contextMenuHandler);

      setMode(CanvasMode.AutoFocus);
      setMouseMode('auto-focus');
    })
    .otherwise(async () => {
      await deviceMaster.rawLooseMotor();
      await deviceMaster.endSubTask();
      await deviceMaster.kick();

      workarea?.removeEventListener('contextmenu', contextMenuHandler);
      workareaEvents.emit('update-context-menu', { menuDisabled: false });

      setMode(CanvasMode.Draw);
      setMouseMode('select');
    });
};
