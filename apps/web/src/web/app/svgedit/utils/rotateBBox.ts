interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const rotateBBox = (bbox: BBox, angle: number): BBox => {
  let points = [
    { x: bbox.x, y: bbox.y },
    { x: bbox.x + bbox.width, y: bbox.y },
    { x: bbox.x, y: bbox.y + bbox.height },
    { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
  ];

  const rad = (angle * Math.PI) / 180;
  const cx = bbox.x + 0.5 * bbox.width;
  const cy = bbox.y + 0.5 * bbox.height;
  points = points.map(({ x, y }) => {
    const dx = x - cx;
    const dy = y - cy;
    return {
      x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
    };
  });

  let [minX, minY, maxX, maxY] = [points[0].x, points[0].y, points[0].x, points[0].y];
  points.forEach((p) => {
    minX = Math.min(p.x, minX);
    maxX = Math.max(p.x, maxX);
    minY = Math.min(p.y, minY);
    maxY = Math.max(p.y, maxY);
  });

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

export default rotateBBox;
