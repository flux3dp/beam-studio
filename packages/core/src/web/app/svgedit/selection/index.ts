import { getSVGAsync } from '@core/helpers/svg-editor-helper';

import { SelectionManager } from './SelectionManager';

const selectionManager = new SelectionManager();

getSVGAsync((global) => {
  selectionManager.init(global.Canvas, global.Editor);
});

export default selectionManager;
export { SelectionManager };
