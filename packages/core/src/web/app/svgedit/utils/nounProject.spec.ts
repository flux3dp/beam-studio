import { isNounProjectElement } from './nounProject';

const setupDom = (content: string) => {
  document.body.innerHTML = `<svg id="svgcontent">${content}</svg>`;
};

const byId = (id: string) => document.getElementById(id)!;

describe('isNounProjectElement', () => {
  test('is true for the imported shape itself', () => {
    setupDom('<g class="layer"><use id="u1" data-np="1" href="#s1" /></g>');

    expect(isNounProjectElement(byId('u1'))).toBe(true);
  });

  test('is true for a path inside a disassembled shape', () => {
    // disassembling copies data-np onto every descendant, but a nested group may not carry it
    setupDom('<g class="layer"><g id="g1" data-np="1"><g id="inner"><path id="p1" /></g></g></g>');

    expect(isNounProjectElement(byId('p1'))).toBe(true);
    expect(isNounProjectElement(byId('inner'))).toBe(true);
  });

  test("is false for the user's own artwork", () => {
    setupDom('<g class="layer"><path id="p1" /><use id="u1" href="#s1" /></g>');

    expect(isNounProjectElement(byId('p1'))).toBe(false);
    expect(isNounProjectElement(byId('u1'))).toBe(false);
  });

  test('is false for a sibling of a Noun Project shape', () => {
    setupDom('<g class="layer"><g id="g1" data-np="1"></g><path id="p1" /></g>');

    expect(isNounProjectElement(byId('p1'))).toBe(false);
  });

  test('ignores data-np values other than 1', () => {
    setupDom('<g class="layer"><path id="p1" data-np="0" /></g>');

    expect(isNounProjectElement(byId('p1'))).toBe(false);
  });

  test('handles a missing element', () => {
    expect(isNounProjectElement(null)).toBe(false);
    expect(isNounProjectElement(undefined)).toBe(false);
  });
});
