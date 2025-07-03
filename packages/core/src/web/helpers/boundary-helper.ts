export const getAbsRect = (left: number, top: number, right: number, bottom: number): string => {
  if (right <= left || bottom <= top) {
    return '';
  }

  return `M${left},${top}H${right}V${bottom}H${left}Z`;
};

export const getRelRect = (x: number, y: number, width: number, height: number): string => {
  if (width <= 0 || height <= 0) {
    return '';
  }

  return `M${x},${y}h${width}v${height}h${-width}Z`;
};

// TODO: add helper to decide text position
