import {
  defaultField,
  defaultGalvoParameters,
  defaultRedLight,
} from 'app/constants/promark-constants';
import { RedDot, Field, GalvoParameters } from 'interfaces/Promark';

const applyRedDot = (
  redDot: RedDot,
  field: Field,
  galvoParameters: GalvoParameters
): { field: Field; galvoParameters: GalvoParameters } => {
  const { offsetX, offsetY, scaleX, scaleY } = redDot ?? defaultRedLight;
  const newField = { ...(field ?? defaultField) };
  const newGalvo = {
    x: { ...(galvoParameters ?? defaultGalvoParameters).x },
    y: { ...(galvoParameters ?? defaultGalvoParameters).y },
  };
  newField.offsetX += offsetX;
  newField.offsetY += offsetY;
  newGalvo.x.scale *= scaleX;
  newGalvo.y.scale *= scaleY;
  return { field: newField, galvoParameters: newGalvo };
};

export default applyRedDot;
