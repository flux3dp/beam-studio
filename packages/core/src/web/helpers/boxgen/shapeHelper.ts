import Vector2d from './vector2d';

export const Direction = {
  RIGHT: new Vector2d(1, 0),
  DOWN: new Vector2d(0, 1),
  LEFT: new Vector2d(-1, 0),
  UP: new Vector2d(0, -1),
};

export const transpose = (input: Vector2d): Vector2d => new Vector2d(input.y, -input.x);

export class Plotter {
  shape: THREE.Shape;

  x = 0;

  y = 0;

  constructor(shape: THREE.Shape) {
    this.shape = shape;
  }

  lineTo(x: number, y: number): void {
    this.shape.lineTo(this.x + x, this.y + y);
    this.x += x;
    this.y += y;
  }

  vecTo(vec: Vector2d, scalar: number): void {
    this.lineTo(vec.x * scalar, vec.y * scalar);
  }

  lineToAbs(x: number, y: number): void {
    this.shape.lineTo(x, y);
    this.x = x;
    this.y = y;
  }
}
