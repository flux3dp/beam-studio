/**
 * API image tracer
 * Ref: none
 */
import tabController from '@core/app/actions/tabController';
import importSvg from '@core/app/svgedit/operations/import/importSvg';
import initState from '@core/app/views/beambox/Right-Panels/ConfigPanel/initState';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import Websocket from '@core/helpers/websocket';

const mockData = {
  layerData:
    '{"\u5716\u5C64_1":{"id":"L0.73519897460938","name":"\u5716\u5C64_1","color":{"red":78.6926070038911,"green":127.501945525292,"blue":255,"typename":"RGBColor"},"power":90,"speed":150}}',
  status: 'ok',
  svg: '<?xml version="1.0" encoding="iso-8859-1"?>\r\n<!-- Generator: Adobe Illustrator 29.4.0, SVG Export Plug-In . SVG Version: 9.03 Build 0)  -->\r\n<svg version="1.1" id="&#x5716;&#x5C64;_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px"\r\n\t y="0px" viewBox="0 0 595.276 841.89" enable-background="new 0 0 595.276 841.89" xml:space="preserve">\r\n<rect x="230.438" y="256.208" fill="#FFFFFF" stroke="#000000" stroke-miterlimit="10" width="108.333" height="131.25"/>\r\n<rect x="310.645" y="330.167" fill="#FFFFFF" stroke="#000000" stroke-miterlimit="10" width="108.334" height="131.25"/>\r\n<rect x="252.586" y="414.542" fill="#FFFFFF" stroke="#000000" stroke-miterlimit="10" width="90.104" height="145.833"/>\r\n</svg>\r\n',
};

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
        await importSvg(new Blob([data.svg], { type: 'text/plain' }), { isFromAI: true });

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

  window.testAIExt = () => events.onMessage(mockData);

  return {
    connection: ws,
  };
};

export default {
  init,
};
