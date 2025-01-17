export type ImageDimension = {
  x: number; // left top x
  y: number; // left top y
  width: number;
  height: number;
  rotation: number;
};

export const calculateDimensionCenter = (dimension: ImageDimension): { x: number; y: number } => {
  const rad = (dimension.rotation * Math.PI) / 180;
  const centerX =
    dimension.x + (dimension.width / 2) * Math.cos(rad) - (dimension.height / 2) * Math.sin(rad);
  const centerY =
    dimension.y + (dimension.width / 2) * Math.sin(rad) + (dimension.height / 2) * Math.cos(rad);
  return { x: centerX, y: centerY };
};

export default {
  calculateDimensionCenter,
};
