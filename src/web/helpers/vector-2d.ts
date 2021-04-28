export interface vector2D {
  x: number,
  y: number,
}

export const v2Add = (a: vector2D, b: vector2D): vector2D => ({
  x: a.x + b.x,
  y: a.y + b.y,
});

export const v2Sum = (...vectors: vector2D[]): vector2D => {
  const res: vector2D = { x: 0, y: 0 };
  for (let i = 0; i < vectors.length; i += 1) {
    res.x += vectors[i].x;
    res.y += vectors[i].y;
  }
  return res;
};

export const v2Sub = (a: vector2D, b: vector2D): vector2D => ({
  x: a.x - b.x,
  y: a.y - b.y,
});

export const v2Length = (v: vector2D): number => Math.hypot(v.x, v.y);

export const v2Normalize = (v: vector2D): vector2D => {
  const len = v2Length(v);
  return len >= 1e-5 ? {
    x: v.x / len,
    y: v.y / len,
  } : { x: 0, y: 0 };
};

export const v2Negate = (v: vector2D): vector2D => ({ x: -v.x, y: -v.y } as vector2D);

// eslint-disable-next-line max-len
export const v2Scale = (v: vector2D, scale: number): vector2D => ({ x: v.x * scale, y: v.y * scale } as vector2D);

export const v2Distance = (a: vector2D, b: vector2D): number => v2Length(v2Sub(a, b));

export const v2Dot = (a: vector2D, b: vector2D): number => a.x * b.x + a.y * b.y;

export const v2Angle = (a: vector2D, b: vector2D): number | null => {
  const la = v2Length(a);
  const lb = v2Length(b);
  return la * lb === 0 ? null : Math.acos(v2Dot(a, b) / (la * lb));
};
