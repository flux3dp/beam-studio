import type { KeyChainCategory } from '../../types';

import { animal } from './animal';
import { iconTextLeft, text } from './customShapes';
import { dialogBox } from './dialogBox';
import { geometry } from './geometry';
import { pet } from './pet';
import { plant } from './plant';
import { capsule, oval, polygonal, quadrilateral, roundArch, rounded, surfingBoard, tag } from './shapes';

export * from './defaults';

export const KEYCHAIN_CATEGORIES: KeyChainCategory[] = [
  surfingBoard,
  capsule,
  oval,
  roundArch,
  tag,
  rounded,
  polygonal,
  quadrilateral,
  pet,
  dialogBox,
  geometry,
  plant,
  animal,
  text,
  iconTextLeft,
];
