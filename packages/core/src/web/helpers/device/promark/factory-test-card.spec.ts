import fs from 'fs';
import path from 'path';

import { LaserType } from '@core/app/constants/promark-constants';

import {
  centerFactoryTestCard,
  fillFactoryTestCard,
  formatCardValue,
  generateFactoryTestCard,
  getCardFields,
  getFactoryTestCardName,
} from './factory-test-card';

const mockGenerateSvgOnlyBeamBuffer = jest.fn();

jest.mock('@core/helpers/beam-file-helper', () => ({
  generateSvgOnlyBeamBuffer: (...args) => mockGenerateSvgOnlyBeamBuffer(...args),
}));

const values = {
  field: { angle: -1.5, offsetX: 3, offsetY: -3 },
  focusDistance: 345,
  galvoParameters: {
    x: { bulge: 0.948, scale: 79.38, skew: 1, trapezoid: 1.005 },
    y: { bulge: 1.03, scale: 79, skew: 1, trapezoid: 1.002 },
  },
  redDot: { offsetX: -1, offsetY: 1, scaleX: 1.015, scaleY: 1.018 },
  width: 220,
};

const template = fs.readFileSync(
  path.resolve(__dirname, '../../../assets/assets/promark-factory-test-card.bvg'),
  'utf-8',
);

describe('test factory-test-card', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getFactoryTestCardName', () => {
    expect(
      getFactoryTestCardName({ info: { laserType: LaserType.Desktop, watt: 20 }, serial: 'SN1', width: 110 }),
    ).toBe('Promark出廠測試卡_背面V2_SN1_D20_110');
    expect(getFactoryTestCardName({ info: { laserType: LaserType.MOPA, watt: 100 }, serial: 'SN2', width: 220 })).toBe(
      'Promark出廠測試卡_背面V2_SN2_M100_220',
    );
    expect(getFactoryTestCardName({ info: { laserType: LaserType.UV, watt: 5 }, serial: 'SN3', width: 70 })).toBe(
      'Promark出廠測試卡_背面V2_SN3_U5_70',
    );
  });

  test('formatCardValue', () => {
    expect(formatCardValue(79.38)).toBe('79.38');
    expect(formatCardValue(1.0049999)).toBe('1.005');
    expect(formatCardValue(100)).toBe('100');
    expect(formatCardValue(-0.0001)).toBe('0');
    expect(formatCardValue(-1.5)).toBe('-1.5');
  });

  test('fillFactoryTestCard', () => {
    expect(fillFactoryTestCard('<a>{{fieldWidth}}</a><b>{{galvoYTrapezoid}}</b>', values)).toBe(
      '<a>220</a><b>1.002</b>',
    );
    expect(() => fillFactoryTestCard('{{unknown}}', values)).toThrow('unknown');
  });

  test('the template has a centred fit text box for every card field', () => {
    const doc = new DOMParser().parseFromString(template, 'image/svg+xml');
    const texts = Array.from(doc.querySelectorAll('text'));
    const names = texts.map((text) => text.textContent!.trim().match(/^\{\{(\w+)\}\}$/)?.[1]);

    expect(names.sort()).toEqual(Object.keys(getCardFields(values)).sort());
    texts.forEach((text) => {
      expect(text.getAttribute('data-fit-text')).toBe('true');
      expect(text.getAttribute('data-fit-text-align')).toBe('middle');
      expect(text.getAttribute('text-anchor')).toBe('middle');
      expect(Number(text.getAttribute('data-fit-text-size'))).toBeGreaterThan(100);
    });
  });

  test('generateFactoryTestCard', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true, text: async () => template });

    global.fetch = mockFetch;
    mockGenerateSvgOnlyBeamBuffer.mockReturnValue(Buffer.from('beam'));

    const blob = await generateFactoryTestCard(values);

    expect(mockFetch).toHaveBeenCalledWith('assets/promark-factory-test-card.bvg');
    expect(blob).toBeInstanceOf(Blob);

    const [svgString] = mockGenerateSvgOnlyBeamBuffer.mock.calls[0];

    expect(svgString).not.toContain('{{');
    expect(svgString).toContain('>79.38</tspan>');
    expect(svgString).toContain('>345</tspan>');
  });

  test('centerFactoryTestCard moves the card to the centre of the work area', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><g class="layer"><title>L</title><path d="m0,0l1,0"/>' +
      '<text x="1100" y="1000"><tspan x="1100" y="1000">a</tspan></text></g></svg>';

    expect(centerFactoryTestCard(svg, 220)).toBe(svg);

    const doc = new DOMParser().parseFromString(centerFactoryTestCard(svg, 110), 'image/svg+xml');

    expect(doc.querySelector('path')!.getAttribute('transform')).toBe('translate(-550,-550)');
    expect(doc.querySelector('text')!.getAttribute('x')).toBe('550');
    expect(doc.querySelector('text')!.getAttribute('y')).toBe('450');
    expect(doc.querySelector('tspan')!.getAttribute('x')).toBe('550');
    expect(doc.querySelector('title')!.hasAttribute('transform')).toBe(false);
  });

  test('generateFactoryTestCard throws when the template cannot be loaded', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

    await expect(generateFactoryTestCard(values)).rejects.toThrow('404');
    expect(mockGenerateSvgOnlyBeamBuffer).not.toHaveBeenCalled();
  });
});
