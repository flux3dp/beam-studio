import NS from '@core/app/constants/namespaces';

import { DECORATION_PATHS } from '../constants/decorations';
import type { DecorationPathOptionDef, ElementOptionDef, KeyChainState, TextOptionDef } from '../types';

const mockApplyTexts = jest.fn();
const mockApplyElements = jest.fn();

jest.mock('./buildText', () => ({
  applyTexts: (...args: any[]) => mockApplyTexts(...args),
}));

jest.mock('./buildElement', () => ({
  applyElements: (...args: any[]) => mockApplyElements(...args),
}));

import { buildDecorations } from './buildDecorations';

describe('buildDecorations', () => {
  const project = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApplyTexts.mockResolvedValue(undefined);
    mockApplyElements.mockResolvedValue(undefined);
  });

  const makeState = (overrides: Partial<KeyChainState> = {}): KeyChainState =>
    ({
      decorationPaths: {},
      elements: {},
      texts: {},
      ...overrides,
    }) as KeyChainState;

  it('should return empty arrays when no defs provided', async () => {
    const result = await buildDecorations(project, makeState(), [], [], []);

    expect(result).toEqual({ emboss: [], engraving: [], refPaths: [] });
  });

  it('should split text defs by emboss flag', async () => {
    const state = makeState({
      texts: {
        t1: {
          emboss: false,
          enabled: true,
          font: {} as any,
          fontSize: 20,
          letterSpacing: 0,
          lineSpacing: 1.2,
          text: 'A',
        },
        t2: {
          emboss: true,
          enabled: true,
          font: {} as any,
          fontSize: 20,
          letterSpacing: 0,
          lineSpacing: 1.2,
          text: 'B',
        },
      },
    });
    const textDefs: TextOptionDef[] = [
      { bounds: { height: 50, width: 100, x: 0, y: 0 }, defaults: {} as any, id: 't1' },
      { bounds: { height: 50, width: 100, x: 0, y: 0 }, defaults: {} as any, id: 't2' },
    ];

    await buildDecorations(project, state, textDefs, [], []);

    // applyTexts called twice: once for engraving, once for emboss
    expect(mockApplyTexts).toHaveBeenCalledTimes(2);

    // First call (engraving) gets only non-emboss text defs
    const engravingTexts = mockApplyTexts.mock.calls[0][2];

    expect(engravingTexts).toHaveLength(1);
    expect(engravingTexts[0].id).toBe('t1');

    // Second call (emboss) gets only emboss text defs
    const embossTexts = mockApplyTexts.mock.calls[1][2];

    expect(embossTexts).toHaveLength(1);
    expect(embossTexts[0].id).toBe('t2');
  });

  it('should split element defs by emboss flag', async () => {
    const state = makeState({
      elements: {
        e1: { emboss: false, enabled: true, shapeKey: 'basic/icon-heart1' },
        e2: { emboss: true, enabled: true, shapeKey: 'basic/icon-star1' },
      },
    });
    const elementDefs: ElementOptionDef[] = [
      { bounds: { height: 50, width: 50, x: 0, y: 0 }, defaults: {} as any, id: 'e1', options: [] },
      { bounds: { height: 50, width: 50, x: 0, y: 0 }, defaults: {} as any, id: 'e2', options: [] },
    ];

    await buildDecorations(project, state, [], elementDefs, []);

    expect(mockApplyElements).toHaveBeenCalledTimes(2);

    const engravingElements = mockApplyElements.mock.calls[0][3];

    expect(engravingElements).toHaveLength(1);
    expect(engravingElements[0].id).toBe('e1');

    const embossElements = mockApplyElements.mock.calls[1][3];

    expect(embossElements).toHaveLength(1);
    expect(embossElements[0].id).toBe('e2');
  });

  it('should apply decoration paths correctly', async () => {
    let state = makeState({
      decorationPaths: {
        dp1: { emboss: false, enabled: true, selectedKey: 'ribbon_band' },
      },
    });
    const decorationDefs: DecorationPathOptionDef[] = [{ defaults: {} as any, id: 'dp1', options: ['ribbon_band'] }];

    let result = await buildDecorations(project, state, [], [], decorationDefs);

    expect(result.engraving.length).toBe(1);
    expect(result.engraving[0].getAttribute('d')).toBe(DECORATION_PATHS.ribbon_band);
    expect(result.engraving[0].getAttribute('fill')).toBe('#000');
    expect(result.emboss.length).toBe(0);

    state = makeState({
      decorationPaths: {
        dp1: { emboss: true, enabled: true, selectedKey: 'ribbon_band' },
      },
    });

    result = await buildDecorations(project, state, [], [], decorationDefs);

    expect(result.emboss.length).toBe(1);
    expect(result.engraving.length).toBe(0);
  });

  it('should skip disabled decoration paths', async () => {
    const state = makeState({
      decorationPaths: {
        dp1: { emboss: false, enabled: false, selectedKey: 'ribbon_band' },
      },
    });
    const decorationDefs: DecorationPathOptionDef[] = [{ defaults: {} as any, id: 'dp1', options: ['ribbon_band'] }];

    const result = await buildDecorations(project, state, [], [], decorationDefs);

    expect(result.engraving.length).toBe(0);
  });

  it('should skip decoration paths with invalid selectedKey', async () => {
    const state = makeState({
      decorationPaths: {
        dp1: { emboss: false, enabled: true, selectedKey: 'nonexistent_key' },
      },
    });
    const decorationDefs: DecorationPathOptionDef[] = [
      { defaults: {} as any, id: 'dp1', options: ['nonexistent_key'] },
    ];

    const result = await buildDecorations(project, state, [], [], decorationDefs);

    expect(result.engraving.length).toBe(0);
  });

  it('should separate textpath ref paths from visible decorations', async () => {
    // Simulate applyTexts adding a refPath and a text element to the SVG
    mockApplyTexts.mockImplementation(async (svg: SVGSVGElement, _state: any, defs: any[]) => {
      if (defs.length === 0) return;

      const refPath = document.createElementNS(NS.SVG, 'path');

      refPath.setAttribute('data-textpath-ref', 'true');
      svg.appendChild(refPath);

      const textEl = document.createElementNS(NS.SVG, 'text');

      svg.appendChild(textEl);
    });

    const state = makeState({
      texts: {
        t1: {
          emboss: false,
          enabled: true,
          font: {} as any,
          fontSize: 20,
          letterSpacing: 0,
          lineSpacing: 1.2,
          text: 'A',
        },
      },
    });
    const textDefs: TextOptionDef[] = [{ defaults: {} as any, id: 't1', path: 'M0 0 L100 0' }];

    const result = await buildDecorations(project, state, textDefs, [], []);

    expect(result.refPaths.length).toBe(1);
    expect(result.refPaths[0].hasAttribute('data-textpath-ref')).toBe(true);
    expect(result.engraving.length).toBe(1);
    expect(result.engraving[0].tagName).toBe('text');
  });

  it('should collect ref paths from both engraving and emboss SVGs', async () => {
    let callIndex = 0;

    mockApplyTexts.mockImplementation(async (svg: SVGSVGElement, _state: any, defs: any[]) => {
      if (defs.length === 0) return;

      const refPath = document.createElementNS(NS.SVG, 'path');

      refPath.setAttribute('data-textpath-ref', 'true');
      refPath.setAttribute('id', `ref-${callIndex}`);
      svg.appendChild(refPath);
      callIndex += 1;
    });

    const state = makeState({
      texts: {
        t1: {
          emboss: false,
          enabled: true,
          font: {} as any,
          fontSize: 20,
          letterSpacing: 0,
          lineSpacing: 1.2,
          text: 'A',
        },
        t2: {
          emboss: true,
          enabled: true,
          font: {} as any,
          fontSize: 20,
          letterSpacing: 0,
          lineSpacing: 1.2,
          text: 'B',
        },
      },
    });
    const textDefs: TextOptionDef[] = [
      { defaults: {} as any, id: 't1', path: 'M0 0' },
      { defaults: {} as any, id: 't2', path: 'M0 0' },
    ];

    const result = await buildDecorations(project, state, textDefs, [], []);

    expect(result.refPaths.length).toBe(2);
  });
});
