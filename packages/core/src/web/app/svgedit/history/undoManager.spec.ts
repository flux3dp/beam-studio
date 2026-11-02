jest.mock('@core/app/svgedit/autoAlign', () => ({ collectAlignPoints: jest.fn() }));
jest.mock('@core/app/svgedit/currentFileManager', () => ({ setHasUnsavedChanges: jest.fn() }));

window.svgedit.transformlist = {
  getTransformList: () => ({ numberOfItems: 0 }),
  removeElementFromListMap: jest.fn(),
};
window.svgedit.utilities = { getRotationAngleFromTransformList: () => 0 };

import history from './history';
import { UndoManager } from './undoManager';

describe('UndoManager.appendCommandToLast', () => {
  let undoManager: UndoManager;
  let layer: Element;
  let image: Element;
  let other: Element;

  beforeEach(() => {
    undoManager = new UndoManager();
    document.body.innerHTML = `<svg><g id="layer" data-stl-point-spacing="0.5"><image id="image" data-grid="40,20" />
      </g><rect id="other" /></svg>`;
    layer = document.getElementById('layer')!;
    image = document.getElementById('image')!;
    other = document.getElementById('other')!;
  });

  /** A layer parameter change as the config panel records it: a batch on the layer group. */
  const changeSpacing = () => {
    const batch = new history.BatchCommand('Change stlPointSpacing');

    layer.setAttribute('data-stl-point-spacing', '0.25');
    batch.addSubCommand(new history.ChangeElementCommand(layer, { 'data-stl-point-spacing': '0.5' }));
    undoManager.addCommandToHistory(batch);
  };

  /** A follow-up on an object in that layer, already applied. */
  const followUp = () => {
    const batch = new history.BatchCommand('Update photo to 3D');

    image.setAttribute('data-grid', '80,40');
    batch.addSubCommand(new history.ChangeElementCommand(image, { 'data-grid': '40,20' }));

    return batch;
  };

  test('folds into a last step that involves any of the expected elements, so one undo reverts both', () => {
    changeSpacing();
    undoManager.appendCommandToLast(followUp(), 'Change stlPointSpacing', [image, layer]);

    expect(undoManager.getUndoStackSize()).toBe(1);

    undoManager.undo();
    expect(layer.getAttribute('data-stl-point-spacing')).toBe('0.5');
    expect(image.getAttribute('data-grid')).toBe('40,20');

    undoManager.redo();
    expect(layer.getAttribute('data-stl-point-spacing')).toBe('0.25');
    expect(image.getAttribute('data-grid')).toBe('80,40');
  });

  test('a last step that involves none of them gets its own step', () => {
    changeSpacing();
    undoManager.appendCommandToLast(followUp(), 'Update photo to 3D', image);
    expect(undoManager.getUndoStackSize()).toBe(2);

    undoManager.appendCommandToLast(followUp(), 'Update photo to 3D', [other]);
    expect(undoManager.getUndoStackSize()).toBe(3);
  });
});
