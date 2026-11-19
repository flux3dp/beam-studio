import { match } from 'ts-pattern';

import { LaserType } from '@core/app/constants/promark-constants';
import beamFileHelper from '@core/helpers/beam-file-helper';
import type { Field, GalvoParameters, PromarkInfo, RedDot } from '@core/interfaces/Promark';

const TEMPLATE_PATH = 'assets/promark-factory-test-card.bvg';

const FACTORY_TEST_CARD_NAME = 'Promark出廠測試卡_背面V2';

/** e.g. D20, M100, U5 */
export const getLaserSourceCode = ({ laserType, watt }: PromarkInfo): string => {
  const prefix = match(laserType)
    .with(LaserType.Desktop, () => 'D')
    .with(LaserType.MOPA, () => 'M')
    .with(LaserType.UV, () => 'U')
    .exhaustive();

  return `${prefix}${watt}`;
};

/** Promark出廠測試卡_背面V2_{serial}_{laser source}_{field size} */
export const getFactoryTestCardName = ({
  info,
  serial,
  width,
}: {
  info: PromarkInfo;
  serial: string;
  width: number;
}): string => [FACTORY_TEST_CARD_NAME, serial, getLaserSourceCode(info), width].join('_');

export interface FactoryTestCardValues {
  field: Field;
  /** mm */
  focusDistance: number;
  galvoParameters: GalvoParameters;
  redDot: RedDot;
  /** the field size, mm */
  width: number;
}

/** Up to 3 decimals without trailing zeros, the way the card is filled in by hand. */
export const formatCardValue = (value: number): string => Number(value.toFixed(3)).toString();

/** Placeholder name in the template -> value printed on the card. */
export const getCardFields = ({
  field,
  focusDistance,
  galvoParameters: { x, y },
  redDot,
  width,
}: FactoryTestCardValues): Record<string, number> => ({
  fieldAngle: field.angle,
  fieldOffsetX: field.offsetX,
  fieldOffsetY: field.offsetY,
  fieldWidth: width,
  focusDistance,
  galvoXBulge: x.bulge,
  galvoXScale: x.scale,
  galvoXSkew: x.skew,
  galvoXTrapezoid: x.trapezoid,
  galvoYBulge: y.bulge,
  galvoYScale: y.scale,
  galvoYSkew: y.skew,
  galvoYTrapezoid: y.trapezoid,
  redDotOffsetX: redDot.offsetX,
  redDotOffsetY: redDot.offsetY,
  redDotScaleX: redDot.scaleX,
  redDotScaleY: redDot.scaleY,
});

/**
 * Fills the `{{name}}` placeholders of the template. A placeholder without a value would print as
 * is on the card, so it is an error rather than an empty field.
 */
export const fillFactoryTestCard = (template: string, values: FactoryTestCardValues): string => {
  const fields = getCardFields(values);

  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    if (!(name in fields)) throw new Error(`Unknown factory test card field: ${name}`);

    return formatCardValue(fields[name]);
  });
};

/** (px) The card is centred at this point of the template, which is drawn on a 220 mm canvas. */
const TEMPLATE_CENTER = 1100;

const shiftAttribute = (elem: Element, name: string, delta: number) => {
  const value = elem.getAttribute(name);

  if (value !== null) elem.setAttribute(name, String(Number((Number(value) + delta).toFixed(5))));
};

/**
 * Moves the card to the centre of a `width` mm work area. Opening a file keeps the work area of the
 * current document, so the card has to be placed for the lens it will be marked with. Texts are
 * shifted by their x/y so fit texts keep their box; paths get a translate.
 */
export const centerFactoryTestCard = (svgString: string, width: number): string => {
  const delta = (width * 10) / 2 - TEMPLATE_CENTER;

  if (delta === 0) return svgString;

  const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');

  doc.querySelectorAll('g.layer > path').forEach((path) => {
    if (path.hasAttribute('transform')) throw new Error('Unexpected transform in the factory test card');

    path.setAttribute('transform', `translate(${delta},${delta})`);
  });
  doc.querySelectorAll('g.layer > text, g.layer > text > tspan').forEach((elem) => {
    shiftAttribute(elem, 'x', delta);
    shiftAttribute(elem, 'y', delta);
  });

  return new XMLSerializer().serializeToString(doc);
};

export const generateFactoryTestCard = async (values: FactoryTestCardValues): Promise<Blob> => {
  const resp = await fetch(TEMPLATE_PATH);

  if (!resp.ok) throw new Error(`Failed to load the factory test card template: ${resp.status}`);

  const svgString = centerFactoryTestCard(fillFactoryTestCard(await resp.text(), values), values.width);

  return new Blob([beamFileHelper.generateSvgOnlyBeamBuffer(svgString)]);
};
