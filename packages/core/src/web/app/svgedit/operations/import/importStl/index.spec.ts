const mockAddCommandToHistory = jest.fn();
const mockPopUp = jest.fn();
const mockSelectStlObject = jest.fn();
const mockUpdateProjectionRect = jest.fn();

const projection = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
const mockSvgCanvas = {
  addSvgElementFromJson: jest.fn(() => projection),
  getNextId: jest.fn(() => 'mesh'),
};

jest.mock('@core/app/actions/alert-caller', () => ({ popUp: (...args: unknown[]) => mockPopUp(...args) }));
jest.mock('@core/app/actions/progress-caller');
jest.mock('@core/app/components/beambox/InnerEngraving/utils/engravable', () => ({
  getEngravableBox: () => ({ center: [50, 60, 70], depth: 100, height: 100, isValid: true, width: 100 }),
}));
jest.mock('@core/app/components/beambox/InnerEngraving/utils/projection', () => ({
  updateProjectionRect: (...args: unknown[]) => mockUpdateProjectionRect(...args),
}));
jest.mock('@core/app/components/beambox/InnerEngraving/utils/selection', () => ({
  selectStlObject: (...args: unknown[]) => mockSelectStlObject(...args),
}));
jest.mock('@core/app/svgedit/history/history', () => ({
  BaseHistoryCommand: class {},
  BatchCommand: class {
    addSubCommand = jest.fn();
  },
  InsertElementCommand: class {},
  RemoveElementCommand: class {},
}));
jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args: unknown[]) => mockAddCommandToHistory(...args),
  appendCommandToLast: jest.fn(),
}));
jest.mock('@core/app/svgedit/stl/sync', () => ({ syncStlObjectsWithDom: jest.fn() }));
jest.mock('@core/helpers/color/updateElementColor', () => jest.fn());
jest.mock('@core/helpers/i18n', () => ({
  lang: { inner_engraving: { auto_fit_message: 'fit?', auto_fit_title: 'fit' } },
}));
jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback: (globalSvg: unknown) => void) => callback({ Canvas: mockSvgCanvas }),
}));
jest.mock('./preCheck', () => ({ performStlPreChecks: jest.fn() }));
jest.mock('three/examples/jsm/loaders/STLLoader.js', () => ({ STLLoader: class {} }));

import { BoxGeometry } from 'three';

import { useStlStore } from '@core/app/stores/stlStore';

import { insertStlGeometry } from './index';

describe('insertStlGeometry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    projection.id = '';
    useStlStore.setState({ objects: {}, selectedId: null });
    mockPopUp.mockImplementation(({ onYes }) => onYes());
  });

  test('uses the centered and adaptively scaled placement as the independent reset baseline', async () => {
    const geometry = new BoxGeometry(20, 10, 5);

    await insertStlGeometry(new ArrayBuffer(1), geometry);

    const object = useStlStore.getState().objects.mesh;

    expect(object.initialTransform).toMatchObject({ position: [50, 60, 70], scale: [0.5, 0.5, 0.5] });
    expect(object.transform).toEqual(object.initialTransform);
    expect(object.transform).not.toBe(object.initialTransform);
    expect(object.transform.position).not.toBe(object.initialTransform.position);
    expect(object.transform.scale).not.toBe(object.initialTransform.scale);
    expect(mockUpdateProjectionRect).toHaveBeenCalledWith(projection, geometry, expect.anything(), {
      initialTransform: object.initialTransform,
      transform: object.transform,
    });
  });
});
