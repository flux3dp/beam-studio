const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args: any[]) => mockPopUp(...args),
}));

import { checkNounProjectElements, removeNPElementsWrapper } from './nounProject';

const setupDom = (content: string): void => {
  document.body.innerHTML = `<svg id="svgcontent">${content}</svg>`;
};

const ids = (selector: string): string[] =>
  Array.from(document.querySelectorAll(selector))
    .map((elem) => elem.getAttribute('id'))
    .filter(Boolean) as string[];

describe('checkNounProjectElements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('resolves true without asking when the scene has no Noun Project shape', async () => {
    setupDom('<g class="layer"><path id="p1" /></g>');

    await expect(checkNounProjectElements()).resolves.toBe(true);
    expect(mockPopUp).not.toHaveBeenCalled();
  });

  test('resolves with the user answer when the scene has one', async () => {
    setupDom('<g class="layer"><path id="np1" data-np="1" /></g>');

    const promise = checkNounProjectElements();

    expect(mockPopUp).toHaveBeenCalledTimes(1);
    mockPopUp.mock.calls[0][0].onNo();
    await expect(promise).resolves.toBe(false);
  });
});

describe('removeNPElementsWrapper', () => {
  test('detaches a marked path while the callback runs', async () => {
    setupDom('<g class="layer"><path id="np1" data-np="1" /><path id="p1" /></g>');

    const seen = await removeNPElementsWrapper(() => ids('#svgcontent *'));

    expect(seen).toEqual(['p1']);
    expect(ids('#svgcontent *')).toEqual(['np1', 'p1']);
  });

  test('detaches the outermost marker in a legacy grouped scene', async () => {
    setupDom('<g class="layer"><g id="g1" data-np="1"><path id="np1" data-np="1" /><path id="np2" /></g></g>');

    const seen = await removeNPElementsWrapper(() => ids('#svgcontent *'));

    expect(seen).toEqual([]);
    expect(ids('#svgcontent *')).toEqual(['g1', 'np1', 'np2']);
  });

  test('leaves a scene without Noun Project shapes untouched', async () => {
    setupDom('<g class="layer"><path id="p1" /></g>');

    const seen = await removeNPElementsWrapper(() => ids('#svgcontent *'));

    expect(seen).toEqual(['p1']);
    expect(ids('#svgcontent *')).toEqual(['p1']);
  });

  test('restores everything when the callback throws', async () => {
    setupDom('<g class="layer"><path id="np1" data-np="1" /></g>');

    await expect(
      removeNPElementsWrapper(() => {
        throw new Error('serialization failed');
      }),
    ).rejects.toThrow('serialization failed');

    expect(ids('#svgcontent *')).toEqual(['np1']);
  });

  test('keeps paths detached across an async callback', async () => {
    setupDom('<g class="layer"><path id="np1" data-np="1" /></g>');

    const seen = await removeNPElementsWrapper(async () => {
      await Promise.resolve();

      return ids('#svgcontent *');
    });

    expect(seen).toEqual([]);
    expect(ids('#svgcontent *')).toEqual(['np1']);
  });

  test('restores the original sibling order', async () => {
    setupDom('<g class="layer"><path id="a" /><path id="np1" data-np="1" /><path id="b" /></g>');

    await removeNPElementsWrapper(() => undefined);

    expect(ids('#svgcontent .layer > *')).toEqual(['a', 'np1', 'b']);
  });
});
