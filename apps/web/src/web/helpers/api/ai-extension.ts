/**
 * API image tracer
 * Ref: none
 */
import importSvg from 'app/svgedit/operations/import/importSvg';
import Websocket from 'helpers/websocket';
import { writeData } from 'helpers/layer/layer-config-helper';

const init = (): { connection: any } => {
  const events = {
    onMessage: async (data) => {
      if (data.svg) {
        await importSvg(new Blob([data.svg], { type: 'text/plain' }), { isFromAI: true });
        if (data.layerData) {
          const layerDataJSON = JSON.parse(data.layerData);
          const layerNames = Object.keys(layerDataJSON);

          for (let i = 0; i < layerNames.length; i += 1) {
            const layerName = layerNames[i];
            const { name, speed, power } = layerDataJSON[layerName];
            writeData(name, 'speed', parseInt(speed, 10));
            writeData(name, 'power', parseInt(power, 10));
          }
        }
      }
    },
    onError: (response: any) => {
      console.log('AI extension error: ', response);
    },
    onFatal: (response: any) => {
      console.log('AI extension fatal error: ', response);
    },
    onOpen: () => {
      console.log('AI extension connected');
    },
  };
  const ws = Websocket({
    method: 'push-studio',
    onMessage: (data) => {
      events.onMessage(data);
    },
    onError: (response) => {
      events.onError(response);
    },
    onFatal: (response) => {
      events.onFatal(response);
    },
  });

  return {
    connection: ws,
  };
}

export default {
  init,
};
