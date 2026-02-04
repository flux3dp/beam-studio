/**
 * API image tracer
 * Ref: none
 */
import tabController from '@core/app/actions/tabController';
import initState from '@core/app/components/beambox/RightPanel/ConfigPanel/initState';
import importSvg from '@core/app/svgedit/operations/import/importSvg';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import Websocket from '@core/helpers/websocket';

const init = (): { connection: any } => {
  const events = {
    onError: (response: any) => {
      console.log('AI extension error: ', response);
    },
    onFatal: (response: any) => {
      console.log('AI extension fatal error: ', response);
    },
    onMessage: async (data: { layerData: string; svg: string }) => {
      if (data.svg) {
        await importSvg(new Blob([data.svg], { type: 'text/plain' }), { importType: 'layer' });

        if (data.layerData) {
          const layerDataJSON = JSON.parse(data.layerData) as Record<
            string,
            { name: string; power: string; speed: string }
          >;
          const layerNames = Object.keys(layerDataJSON);

          for (let i = 0; i < layerNames.length; i += 1) {
            const layerName = layerNames[i];
            const { name, power, speed } = layerDataJSON[layerName];

            writeData(name, 'speed', Number.parseInt(speed, 10));
            writeData(name, 'power', Number.parseInt(power, 10));
          }
          initState();
        }
      }
    },
  };
  const ws = Websocket({
    method: 'push-studio',
    onError: (response) => {
      events.onError(response);
    },
    onFatal: (response) => {
      events.onFatal(response);
    },
    onMessage: (data) => {
      events.onMessage(data);
    },
    onOpen: () => {
      console.log('AI extension connected');

      if (tabController.isFocused) ws?.send('set_handler');
    },
  });

  tabController.onFocused(() => {
    ws?.send('set_handler');
  });

  return {
    connection: ws,
  };
};

export default {
  init,
};
