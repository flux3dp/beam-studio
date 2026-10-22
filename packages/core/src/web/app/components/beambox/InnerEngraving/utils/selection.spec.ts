import { useStlStore } from '@core/app/stores/stlStore';

const mockClearSelection = jest.fn();
const mockSelectOnly = jest.fn();

jest.mock('@core/app/svgedit/selection', () => ({
  clearSelection: (...args: unknown[]) => mockClearSelection(...args),
  selectOnly: (...args: unknown[]) => mockSelectOnly(...args),
}));

const mockSetSelectedLayers = jest.fn();

jest.mock('@core/app/svgedit/layer/layerManager', () => ({
  setSelectedLayers: (...args: unknown[]) => mockSetSelectedLayers(...args),
}));

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getObjectLayer: (elem: Element) => ({ title: elem.parentElement!.getAttribute('data-title') }),
}));

import { getSelectedStlIds, selectStlObject, selectStlObjects, toggleStlObjectSelection } from './selection';

describe('3D selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = `
      <svg>
        <g data-title="A"><rect id="a" data-stl="1" /><rect id="b" data-stl="1" /></g>
        <g data-title="B"><rect id="c" data-stl="1" /><rect id="flat" /></g>
      </svg>`;
    useStlStore.setState({ selectedIds: [] });
  });

  test('selecting objects selects them in svgedit and selects their layers once each', () => {
    selectStlObjects(['a', 'c', 'b']);

    expect(useStlStore.getState().selectedIds).toEqual(['a', 'c', 'b']);
    expect(mockSelectOnly).toHaveBeenCalledWith(['a', 'c', 'b'].map((id) => document.getElementById(id)));
    expect(mockSetSelectedLayers).toHaveBeenCalledWith(['A', 'B']);
  });

  test('ids without a projection are dropped; none left clears the selection', () => {
    selectStlObjects(['gone']);

    expect(useStlStore.getState().selectedIds).toEqual([]);
    expect(mockClearSelection).toHaveBeenCalledTimes(1);
    expect(mockSelectOnly).not.toHaveBeenCalled();

    selectStlObject(null);
    expect(mockClearSelection).toHaveBeenCalledTimes(2);
  });

  test('Shift-click adds an object, and takes a selected one out', () => {
    selectStlObject('a');
    toggleStlObjectSelection('c');
    expect(useStlStore.getState().selectedIds).toEqual(['a', 'c']);

    toggleStlObjectSelection('a');
    expect(useStlStore.getState().selectedIds).toEqual(['c']);
    expect(mockSetSelectedLayers).toHaveBeenLastCalledWith(['B']);

    toggleStlObjectSelection('c');
    expect(useStlStore.getState().selectedIds).toEqual([]);
    expect(mockClearSelection).toHaveBeenCalledTimes(1);
  });

  test('only a selection made entirely of 3D objects maps back to ids', () => {
    const [a, c, flat] = ['a', 'c', 'flat'].map((id) => document.getElementById(id)!);

    expect(getSelectedStlIds([a, c])).toEqual(['a', 'c']);
    expect(getSelectedStlIds([a, flat])).toEqual([]);
    expect(getSelectedStlIds([])).toEqual([]);
  });
});
