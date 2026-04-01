import type paper from 'paper';

import type { ILang } from '@core/interfaces/ILang';
import type { KeysWithType } from '@core/interfaces/utils';

export interface KeyChainShape {
  bounds: paper.Rectangle;
  svgElement: SVGSVGElement;
}

export interface HoleOptionValues {
  diameter: number;
  enabled: boolean;
  offset: number;
  position: number;
  thickness: number;
}

export interface HoleOptionDef {
  defaults: HoleOptionValues;
  id: string;
  label?: string;
  startPositionRef: KeysWithType<paper.Rectangle, paper.Point>;
  type: 'hole';
}

export interface TextOptionValues {
  content: string;
  enabled: boolean;
  fontSize: number;
  letterSpacing: number;
  lineSpacing: number;
}

export interface TextOptionDef {
  bounds: { height: number; width: number; x: number; y: number };
  defaults: TextOptionValues;
  id: string;
  label?: string;
  type: 'text';
}

export type KeyChainOptionDef = HoleOptionDef | TextOptionDef;

export interface KeyChainCategory {
  defaultViewBox: { height: number; width: number; x: number; y: number };
  id: string;
  nameKey: KeysWithType<ILang['keychain_generator']['types'], string>;
  options: KeyChainOptionDef[];
  svgContent: string;
  thumbnail: string;
}

export interface KeyChainState {
  categoryId: string;
  holes: Record<string, HoleOptionValues>;
  texts: Record<string, TextOptionValues>;
}
