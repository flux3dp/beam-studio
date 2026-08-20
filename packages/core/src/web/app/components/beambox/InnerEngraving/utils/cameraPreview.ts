/** Convert a point on the 3D floor to the camera/2D work-area coordinate system. */
export const toCameraPreviewPoint = (
  point: { x: number; y: number },
  workarea: { height: number; width: number },
): [number, number] => {
  const x = Math.min(Math.max(point.x, 0), workarea.width);
  const sceneY = Math.min(Math.max(point.y, 0), workarea.height);

  // 3D Y=max and 2D Y=0 both represent the physical far side.
  return [x, workarea.height - sceneY];
};
