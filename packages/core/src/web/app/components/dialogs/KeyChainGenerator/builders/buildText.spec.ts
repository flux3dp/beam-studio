import NS from '@core/app/constants/namespaces';

import type { KeyChainState, TextOptionDef } from '../types';

const mockGetFontOfPostscriptName = jest.fn();

jest.mock('@core/app/actions/beambox/font-funcs', () => ({
  getFontOfPostscriptName: mockGetFontOfPostscriptName,
}));

import { applyTexts, createTextElement, createTextPath } from './buildText';

const defaultFont = { family: 'Arial', postscriptName: 'ArialMT', style: 'Regular' };

// jsdom doesn't implement getBBox — provide a stub
beforeAll(() => {
  (SVGElement.prototype as any).getBBox = jest.fn().mockReturnValue({ height: 20, width: 40, x: 0, y: 0 });
});

describe('createTextElement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFontOfPostscriptName.mockReturnValue(null);
  });

  it('should create a text element with font attributes', async () => {
    const text = await createTextElement('Hello', defaultFont, 20, 0, 1.2);

    expect(text.tagName).toBe('text');
    expect(text.getAttribute('font-family')).toBe("'Arial'");
    expect(text.getAttribute('font-postscript')).toBe('ArialMT');
    expect(text.getAttribute('font-size')).toBe('20');
    expect(text.getAttribute('fill')).toBe('#000');
    expect(text.getAttribute('text-anchor')).toBe('middle');
    expect(text.getAttributeNS(NS.XML, 'space')).toBe('preserve');
  });

  it('should create tspan children for each line', async () => {
    const text = await createTextElement('Line1\nLine2\nLine3', defaultFont, 20, 0, 1.2);
    const tspans = text.querySelectorAll('tspan');

    expect(tspans.length).toBe(3);
    expect(tspans[0].textContent).toBe('Line1');
    expect(tspans[1].textContent).toBe('Line2');
    expect(tspans[2].textContent).toBe('Line3');
  });

  it('should position tspans with correct y based on lineSpacing', async () => {
    const text = await createTextElement('A\nB', defaultFont, 20, 0, 1.5);
    const tspans = text.querySelectorAll('tspan');

    // y = fontSize(20) for first, fontSize + lineHeight(20*1.5=30) for second
    expect(tspans[0].getAttribute('y')).toBe('20');
    expect(tspans[1].getAttribute('y')).toBe('50'); // 20 + 30
  });

  it('should use bounds for positioning when provided', async () => {
    const bounds = { height: 100, width: 200, x: 10, y: 20 };
    const text = await createTextElement('Hello', defaultFont, 20, 0, 1.2, bounds);
    const tspan = text.querySelector('tspan')!;

    expect(tspan.getAttribute('x')).toBe('110'); // 10 + 200/2
    expect(tspan.getAttribute('y')).toBe('40'); // 20 + 20(fontSize)
  });

  it('should set letter-spacing when non-zero', async () => {
    const text = await createTextElement('Hi', defaultFont, 20, 2, 1.2);

    expect(text.getAttribute('letter-spacing')).toBe('2');
  });

  it('should not set letter-spacing when zero', async () => {
    const text = await createTextElement('Hi', defaultFont, 20, 0, 1.2);

    expect(text.hasAttribute('letter-spacing')).toBe(false);
  });

  it('should apply font-weight and font-style from font descriptor', async () => {
    mockGetFontOfPostscriptName.mockReturnValue({ italic: true, weight: 700 });

    const text = await createTextElement('Bold', defaultFont, 20, 0, 1.2);

    expect(text.getAttribute('font-weight')).toBe('700');
    expect(text.getAttribute('font-style')).toBe('italic');
  });

  it('should strip trailing empty lines', async () => {
    const text = await createTextElement('Line1\n\n', defaultFont, 20, 0, 1.2);
    const tspans = text.querySelectorAll('tspan');

    expect(tspans.length).toBe(1);
  });
});

describe('createTextPath', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFontOfPostscriptName.mockReturnValue(null);
  });

  it('should create a reference path with correct attributes', async () => {
    const { refPath } = await createTextPath('Hello', defaultFont, 20, 0, 'M0 0 L100 0', 'tp-1');

    expect(refPath.getAttribute('id')).toBe('tp-1');
    expect(refPath.getAttribute('d')).toBe('M0 0 L100 0');
    expect(refPath.getAttribute('fill')).toBe('none');
    expect(refPath.getAttribute('stroke')).toBe('none');
    expect(refPath.getAttribute('data-textpath-ref')).toBe('true');
  });

  it('should create a text element with textPath child', async () => {
    const { textEl } = await createTextPath('Hello', defaultFont, 20, 0, 'M0 0', 'tp-1');
    const textPath = textEl.querySelector('textPath')!;

    expect(textPath).not.toBeNull();
    expect(textPath.getAttribute('href')).toBe('#tp-1');
    expect(textPath.getAttribute('startOffset')).toBe('50%');
    expect(textPath.textContent).toBe('Hello');
  });

  it('should replace newlines with spaces in textPath content', async () => {
    const { textEl } = await createTextPath('Line1\nLine2', defaultFont, 20, 0, 'M0 0', 'tp-1');
    const textPath = textEl.querySelector('textPath')!;

    expect(textPath.textContent).toBe('Line1 Line2');
  });
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
