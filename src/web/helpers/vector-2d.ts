export interface vector2D {
    x: number,
    y: number,
}

export const v2Add = (a: vector2D, b: vector2D) => {
    const res = { x: 0, y: 0 } as vector2D;
    res.x = a.x + b.x;
    res.y = a.y + b.y;
    return res;
}

export const v2Sum = (...vectors: vector2D[]) => {
    const res = { x: 0, y: 0 } as vector2D;
    for (let i = 0; i < vectors.length; i++) {
        res.x += vectors[i].x;
        res.y += vectors[i].y;
    }
    return res;
}

export const v2Sub = (a: vector2D, b: vector2D) => {
    const res = { x: 0, y: 0 } as vector2D;
    res.x = a.x - b.x;
    res.y = a.y - b.y;
    return res;
}

export const v2Length = (v: vector2D) => {
    return Math.hypot(v.x, v.y);
}

export const v2Normalize = (v: vector2D) => {
    const len = v2Length(v);
    if (len >= 1e-5) {
        const res = { x: v.x / len, y: v.y / len } as vector2D;
        return res;
    }
    return { x: 0, y: 0 } as vector2D;
}

export const v2Negate = (v: vector2D) => {
    return { x: -v.x, y: -v.y } as vector2D;
}

export const v2Scale = (v: vector2D, scale: number) => {
    return { x: v.x * scale, y: v.y * scale } as vector2D;
}

export const v2Distance = (a: vector2D, b: vector2D) => {
    return v2Length(v2Sub(a, b));
}

export const v2Dot = (a: vector2D, b: vector2D) => {
    return a.x * b.x + a.y * b.y;
}

export const v2Angle = (a: vector2D, b:vector2D) => {
    const la = v2Length(a);
    const lb = v2Length(b);
    if (la * lb === 0) {
        return null;
    }
    return Math.acos(v2Dot(a, b) / (la * lb));

}
