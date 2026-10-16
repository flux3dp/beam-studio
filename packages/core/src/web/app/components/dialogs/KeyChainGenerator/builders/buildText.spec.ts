import NS from '@core/app/constants/namespaces';

import type { KeyChainState, TextOptionDef } from '../types';

const mockGetFontOfPostscriptName = jest.fn();

jest.mock('@core/app/actions/beambox/font-funcs', () => ({
  getFontOfPostscriptName: mockGetFontOfPostscriptName,
}));

import { applyTexts } from './buildText';

const defaultFont = { family: 'Arial', postscriptName: 'ArialMT', style: 'Regular' };

// jsdom doesn't implement getBBox — provide a stub
beforeAll(() => {
  (SVGElement.prototype as any).getBBox = jest.fn().mockReturnValue({ height: 20, width: 40, x: 0, y: 0 });
});

describe('applyTexts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFontOfPostscriptName.mockReturnValue(null);
  });

  const makeState = (overrides: Record<string, any> = {}): KeyChainState =>
    ({
      texts: {
        t1: {
          emboss: false,
          enabled: true,
          font: defaultFont,
          fontSize: 20,
          letterSpacing: 0,
          lineSpacing: 1.2,
          text: 'Hello',
          ...overrides,
        },
      },
    }) as unknown as KeyChainState;

  it('should skip disabled text defs', async () => {
    const svg = document.createElementNS(NS.SVG, 'svg');
    const state = makeState({ enabled: false });
    const textDefs: TextOptionDef[] = [
      { bounds: { height: 50, width: 100, x: 0, y: 0 }, defaults: {} as any, id: 't1' },
    ];

    await applyTexts(svg, state, textDefs);
    expect(svg.children.length).toBe(0);
  });

  it('should skip text defs with empty text', async () => {
    const svg = document.createElementNS(NS.SVG, 'svg');
    const state = makeState({ text: '   ' });
    const textDefs: TextOptionDef[] = [
      { bounds: { height: 50, width: 100, x: 0, y: 0 }, defaults: {} as any, id: 't1' },
    ];

    await applyTexts(svg, state, textDefs);
    expect(svg.children.length).toBe(0);
  });

  it('should append text element for bounded text def', async () => {
    const svg = document.createElementNS(NS.SVG, 'svg');
    const state = makeState();
    const textDefs: TextOptionDef[] = [
      { bounds: { height: 500, width: 500, x: 0, y: 0 }, defaults: {} as any, id: 't1' },
    ];

    await applyTexts(svg, state, textDefs);
    expect(svg.querySelector('text')).not.toBeNull();
  });

  it('should append refPath and text for path text def', async () => {
    const svg = document.createElementNS(NS.SVG, 'svg');
    const state = makeState();
    const textDefs: TextOptionDef[] = [{ defaults: {} as any, id: 't1', path: 'M0 0 C50 -50 100 50 150 0' }];

    await applyTexts(svg, state, textDefs);

    const refPath = svg.querySelector('path[data-textpath-ref]');
    const textPath = svg.querySelector('textPath');

    expect(refPath).not.toBeNull();
    expect(textPath).not.toBeNull();
    expect(textPath!.getAttribute('href')).toBe('#kc-tp-t1');
  });

  it('should scale down font size when text exceeds bounds', async () => {
    // First getBBox returns oversized, second returns within bounds
    const getBBoxMock = jest
      .fn()
      .mockReturnValueOnce({ height: 30, width: 200, x: 0, y: 0 }) // exceeds width 100
      .mockReturnValueOnce({ height: 30, width: 90, x: 0, y: 5 }); // fits

    (SVGElement.prototype as any).getBBox = getBBoxMock;

    const svg = document.createElementNS(NS.SVG, 'svg');
    const state = makeState();
    const textDefs: TextOptionDef[] = [
      { bounds: { height: 50, width: 100, x: 0, y: 0 }, defaults: {} as any, id: 't1' },
    ];

    await applyTexts(svg, state, textDefs);

    const textEl = svg.querySelector('text')!;

    // Font size should have been reduced
    expect(Number(textEl.getAttribute('font-size'))).toBeLessThan(20);

    // Restore default getBBox
    (SVGElement.prototype as any).getBBox = jest.fn().mockReturnValue({ height: 20, width: 40, x: 0, y: 0 });
  });

  it('should vertically center text within bounds', async () => {
    (SVGElement.prototype as any).getBBox = jest.fn().mockReturnValue({ height: 20, width: 40, x: 30, y: 10 });

    const svg = document.createElementNS(NS.SVG, 'svg');
    const state = makeState();
    const textDefs: TextOptionDef[] = [
      { bounds: { height: 100, width: 200, x: 0, y: 0 }, defaults: {} as any, id: 't1' },
    ];

    await applyTexts(svg, state, textDefs);

    const tspan = svg.querySelector('tspan')!;
    const y = Number(tspan.getAttribute('y'));

    // offsetY = bounds.y + bounds.height/2 - (bbox.y + bbox.height/2) = 0 + 50 - (10 + 10) = 30
    // original y = 0 + 20 (fontSize) = 20, adjusted = 20 + 30 = 50
    expect(y).toBe(50);

    // Restore
    (SVGElement.prototype as any).getBBox = jest.fn().mockReturnValue({ height: 20, width: 40, x: 0, y: 0 });
  });

  it('should skip text with missing values in state', async () => {
    const svg = document.createElementNS(NS.SVG, 'svg');
    const state = { texts: {} } as unknown as KeyChainState;
    const textDefs: TextOptionDef[] = [
      { bounds: { height: 50, width: 100, x: 0, y: 0 }, defaults: {} as any, id: 'missing' },
    ];

    await applyTexts(svg, state, textDefs);
    expect(svg.children.length).toBe(0);
  });
});
