import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import createNewText from '@core/app/svgedit/text/createNewText';
import { createNewFitText } from '@core/app/svgedit/text/fitText';
import workareaManager from '@core/app/svgedit/workarea';

import importTextAsStl from './importText';

export type Default3dTextType = 'fit-text' | 'text';

/** Insert the fixed initial content directly as a centred 3D object, without opening the 2D editor. */
const insertDefaultTextAsStl = async (type: Default3dTextType): Promise<boolean> => {
  setMouseMode('select');

  const x = workareaManager.width / 2;
  const y = workareaManager.height / 2;
  const text = (
    type === 'fit-text'
      ? createNewFitText(x, y, { addToHistory: true, text: 'Text' })
      : createNewText(x, y, { addToHistory: true, text: 'Text' })
  ) as SVGTextElement;

  return importTextAsStl(text);
};

export default insertDefaultTextAsStl;
