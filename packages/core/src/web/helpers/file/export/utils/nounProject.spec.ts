const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args: any[]) => mockPopUp(...args),
}));

import { checkNounProjectElements, removeNPElementsWrapper } from './nounProject';

/**
 * Mirrors the editor's shape: `#svg_defs > defs` holds the symbols, `#svgcontent` holds the layers.
 * The HTML parser puts everything under <svg> in the SVG namespace, including xlink attributes.
 */
const setupDom = ({ content = '', defs = '' }: { content?: string; defs?: string }) => {
  document.body.innerHTML = `
    <svg id="svgcanvas">
      <svg id="svg_defs"><defs>${defs}</defs></svg>
      <svg id="svgcontent">${content}</svg>
    </svg>`;
};

/** Ids of the matched elements, in document order. The layer wrapper has none and is skipped. */
const ids = (selector: string) =>
  Array.from(document.querySelectorAll(selector))
    .map((elem) => elem.getAttribute('id'))
    .filter(Boolean);

describe('checkNounProjectElements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('resolves true without asking when the scene has no Noun Project shape', async () => {
    setupDom({ content: '<g class="layer"><path id="p1" /></g>' });

    await expect(checkNounProjectElements()).resolves.toBe(true);
    expect(mockPopUp).not.toHaveBeenCalled();
  });

  test('resolves with the user answer when the scene has one', async () => {
    setupDom({ content: '<g class="layer"><use id="u1" data-np="1" href="#s1" /></g>' });

    const promise = checkNounProjectElements();

    expect(mockPopUp).toHaveBeenCalledTimes(1);

    mockPopUp.mock.calls[0][0].onNo();
    await expect(promise).resolves.toBe(false);
  });
});

describe('removeNPElementsWrapper', () => {
  test('detaches a shape that was never disassembled, together with its symbol', async () => {
    setupDom({
      content: '<g class="layer"><use id="u1" data-np="1" href="#s1" /><path id="p1" /></g>',
      defs: '<symbol id="s1"><path id="art" /></symbol>',
    });

    const seen = await removeNPElementsWrapper(() => ({
      content: ids('#svgcontent *'),
      defs: ids('defs *'),
    }));

    // the licensed geometry is gone from both halves while fn runs
    expect(seen.content).toEqual(['p1']);
    expect(seen.defs).toEqual([]);

    // ...and the canvas is whole again afterwards
    expect(ids('#svgcontent *')).toEqual(['u1', 'p1']);
    expect(ids('defs *')).toEqual(['s1', 'art']);
  });

  test('resolves xlink:href as well as href', async () => {
    setupDom({
      content: '<g class="layer"><use id="u1" data-np="1" xlink:href="#s1" /></g>',
      defs: '<symbol id="s1"><path id="art" /></symbol>',
    });

    const seen = await removeNPElementsWrapper(() => ids('defs *'));

    expect(seen).toEqual([]);
    expect(ids('defs *')).toEqual(['s1', 'art']);
  });

  test('detaches a disassembled shape by its outermost element only', async () => {
    setupDom({
      content:
        '<g class="layer"><g id="g1" data-np="1"><path id="c1" data-np="1" /><path id="c2" data-np="1" /></g></g>',
    });

    const seen = await removeNPElementsWrapper(() => ids('#svgcontent *'));

    expect(seen).toEqual([]);
    expect(ids('#svgcontent *')).toEqual(['g1', 'c1', 'c2']);
  });

  test('keeps a symbol another shape still references', async () => {
    setupDom({
      content: '<g class="layer"><use id="u1" data-np="1" href="#s1" /><use id="u2" href="#s1" /></g>',
      defs: '<symbol id="s1"><path id="art" /></symbol>',
    });

    const seen = await removeNPElementsWrapper(() => ({ content: ids('#svgcontent *'), defs: ids('defs *') }));

    expect(seen.content).toEqual(['u2']);
    expect(seen.defs).toEqual(['s1', 'art']);
  });

  test('detaches the paired image symbol along with the vector one', async () => {
    setupDom({
      content: '<g class="layer"><use id="u1" data-np="1" href="#s1_image" /></g>',
      defs: '<symbol id="s1"><path id="art" /></symbol><symbol id="s1_image" data-origin-symbol="s1"></symbol>',
    });

    const seen = await removeNPElementsWrapper(() => ids('defs > *'));

    expect(seen).toEqual([]);
    expect(ids('defs > *')).toEqual(['s1', 's1_image']);
  });

  test('leaves a scene without Noun Project shapes untouched', async () => {
    setupDom({
      content: '<g class="layer"><use id="u1" href="#s1" /></g>',
      defs: '<symbol id="s1"><path id="art" /></symbol>',
    });

    const seen = await removeNPElementsWrapper(() => ({ content: ids('#svgcontent *'), defs: ids('defs *') }));

    expect(seen.content).toEqual(['u1']);
    expect(seen.defs).toEqual(['s1', 'art']);
  });

  test('restores everything when fn throws', async () => {
    setupDom({
      content: '<g class="layer"><use id="u1" data-np="1" href="#s1" /></g>',
      defs: '<symbol id="s1"><path id="art" /></symbol>',
    });

    await expect(
      removeNPElementsWrapper(() => {
        throw new Error('serialization failed');
      }),
    ).rejects.toThrow('serialization failed');

    expect(ids('#svgcontent *')).toEqual(['u1']);
    expect(ids('defs *')).toEqual(['s1', 'art']);
  });

  test('keeps the shapes detached across an async fn, not just up to its first await', async () => {
    setupDom({
      content: '<g class="layer"><use id="u1" data-np="1" href="#s1" /></g>',
      defs: '<symbol id="s1"><path id="art" /></symbol>',
    });

    const seen = await removeNPElementsWrapper(async () => {
      await Promise.resolve();

      return { content: ids('#svgcontent *'), defs: ids('defs *') };
    });

    expect(seen.content).toEqual([]);
    expect(seen.defs).toEqual([]);
    expect(ids('#svgcontent *')).toEqual(['u1']);
  });

  test('restores the original sibling order', async () => {
    setupDom({
      content: '<g class="layer"><path id="a" /><use id="u1" data-np="1" href="#s1" /><path id="b" /></g>',
      defs: '<symbol id="s1"></symbol>',
    });

    await removeNPElementsWrapper(() => undefined);

    expect(ids('#svgcontent .layer > *')).toEqual(['a', 'u1', 'b']);
  });
});
