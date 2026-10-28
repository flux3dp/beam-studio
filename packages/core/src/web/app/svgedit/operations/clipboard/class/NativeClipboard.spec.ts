import { NativeClipboard } from './NativeClipboard';

const mockUuid = jest.fn();

jest.mock('uuid', () => ({ v4: () => mockUuid() }));

jest.mock('@core/app/actions/tabController', () => ({ currentId: 1 }));

jest.mock('../helpers/updateSymbolStyle', () => ({ updateSymbolStyle: jest.fn() }));

jest.mock('@core/app/svgedit/stl/getters', () => ({
  is3dProjection: (elem: Element) => elem.hasAttribute('data-stl'),
}));

const mockObjects: Record<string, unknown> = {};

jest.mock('@core/app/stores/stlStore', () => ({
  useStlStore: { getState: () => ({ objects: mockObjects }) },
}));

// every copy gets a fresh id, like the real drawing does
let nextId = 100;
const mockCopyElemData = jest.fn(({ attributes, nodeName }) => {
  const elem = document.createElementNS('http://www.w3.org/2000/svg', nodeName);

  attributes.forEach(({ nodeName: name, value }: { nodeName: string; value: string }) => {
    elem.setAttribute(name, value);
  });
  elem.id = `svg_${nextId++}`;

  return elem;
});

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback: (args: unknown) => void) =>
    callback({ Canvas: { getCurrentDrawing: () => ({ copyElemData: mockCopyElemData }) } }),
}));

let clipboardText = '';

Object.assign(navigator, {
  clipboard: {
    readText: jest.fn(async () => clipboardText),
    writeText: jest.fn(async (text: string) => {
      clipboardText = text;
    }),
  },
});

const createProjectionRect = (id: string) => {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

  rect.id = id;
  rect.setAttribute('data-stl', '1');
  document.body.appendChild(rect);

  return rect;
};

describe('NativeClipboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    clipboardText = '';
    mockUuid.mockReturnValue('data-of-this-tab');
    Object.keys(mockObjects).forEach((key) => delete mockObjects[key]);
    mockObjects.svg_5 = { id: 'svg_5', kind: 'mesh' };
  });

  test('re-keys the cached mesh onto the element handed back for the data this tab wrote', async () => {
    const clipboard = new NativeClipboard();

    await clipboard.copyElements([createProjectionRect('svg_5')]);

    const [pasted] = await clipboard.getData();

    expect(pasted.id).not.toBe('svg_5');
    expect(clipboard.getStlFromClipboard(pasted.id)).toBe(mockObjects.svg_5);
    expect(clipboard.getStlFromClipboard('svg_5')).toBeUndefined();
  });

  test('matches no mesh for data written by another tab, even when the ids collide', async () => {
    const clipboard = new NativeClipboard();

    await clipboard.copyElements([createProjectionRect('svg_5')]);

    // another tab copied a different 3D object whose rect happens to be svg_5 there too
    const otherTabData = { ...JSON.parse(clipboardText.substring(8)), id: 'data-of-other-tab', source: '2' };

    clipboardText = `BX clip:${JSON.stringify(otherTabData)}`;

    const [pasted] = await clipboard.getData();

    expect(pasted).toBeDefined();
    expect(clipboard.getStlFromClipboard(pasted.id)).toBeUndefined();
  });

  test('forgets the previous paste mapping when the clipboard content changes', async () => {
    const clipboard = new NativeClipboard();

    await clipboard.copyElements([createProjectionRect('svg_5')]);

    const [firstPaste] = await clipboard.getData();

    expect(clipboard.getStlFromClipboard(firstPaste.id)).toBe(mockObjects.svg_5);

    clipboardText = `BX clip:${JSON.stringify({ ...JSON.parse(clipboardText.substring(8)), id: 'other' })}`;
    await clipboard.getData();

    expect(clipboard.getStlFromClipboard(firstPaste.id)).toBeUndefined();
  });
});
