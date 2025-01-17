export default class Vector2d {
  x: number;

  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  mul(scale: number): Vector2d {
    return new Vector2d(this.x * scale, this.y * scale);
  }
}
