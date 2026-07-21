import * as THREE from 'three';

import Vector2d from './vector2d';
import { Direction, Plotter, transpose } from './shapeHelper';

describe('Direction', () => {
  test('defines the four unit directions with a y-down convention', () => {
    expect([Direction.DOWN.x, Direction.DOWN.y]).toEqual([0, 1]);
    expect([Direction.UP.x, Direction.UP.y]).toEqual([0, -1]);
    expect([Direction.LEFT.x, Direction.LEFT.y]).toEqual([-1, 0]);
    expect([Direction.RIGHT.x, Direction.RIGHT.y]).toEqual([1, 0]);
  });

  test('directions are Vector2d instances', () => {
    expect(Direction.UP).toBeInstanceOf(Vector2d);
  });
});

describe('transpose', () => {
  test('rotates a vector 90 degrees: (x, y) -> (y, -x)', () => {
    const result = transpose(new Vector2d(1, 2));

    expect(result.x).toBeCloseTo(2);
    expect(result.y).toBeCloseTo(-1);
  });

  test('maps RIGHT to UP', () => {
    const result = transpose(Direction.RIGHT);

    expect(result.x).toBeCloseTo(Direction.UP.x);
    expect(result.y).toBeCloseTo(Direction.UP.y);
  });

  test('handles the zero vector', () => {
    const result = transpose(new Vector2d(0, 0));

    expect(result.x).toBe(0);
    expect(result.y).toBe(-0);
  });

  test('handles negative coordinates', () => {
    const result = transpose(new Vector2d(-3, -4));

    expect(result.x).toBeCloseTo(-4);
    expect(result.y).toBeCloseTo(3);
  });

  test('applying transpose four times returns to the original', () => {
    const start = new Vector2d(5, 7);
    const result = transpose(transpose(transpose(transpose(start))));

    expect(result.x).toBeCloseTo(5);
    expect(result.y).toBeCloseTo(7);
  });

  test('returns a new instance', () => {
    const input = new Vector2d(1, 2);

    expect(transpose(input)).not.toBe(input);
  });
});

describe('Plotter', () => {
  const getPoints = (shape: THREE.Shape) => shape.getPoints().map((p) => [p.x, p.y]);

  test('initializes cursor at the origin', () => {
    const plotter = new Plotter(new THREE.Shape());

    expect(plotter.x).toBe(0);
    expect(plotter.y).toBe(0);
  });

  test('lineTo draws relative to the current cursor and advances it', () => {
    const shape = new THREE.Shape();
    const plotter = new Plotter(shape);

    plotter.lineTo(2, 3);

    expect(plotter.x).toBe(2);
    expect(plotter.y).toBe(3);

    plotter.lineTo(1, -1);

    expect(plotter.x).toBe(3);
    expect(plotter.y).toBe(2);

    // shape path starts at the origin and visits each cursor position in order
    expect(getPoints(shape)).toEqual([
      [0, 0],
      [2, 3],
      [3, 2],
    ]);
  });

  test('lineTo accumulates relative moves including negative deltas', () => {
    const plotter = new Plotter(new THREE.Shape());

    plotter.lineTo(-5, -5);
    plotter.lineTo(-5, 10);

    expect(plotter.x).toBe(-10);
    expect(plotter.y).toBe(5);
  });

  test('vecTo scales a direction vector before drawing relatively', () => {
    const shape = new THREE.Shape();
    const plotter = new Plotter(shape);

    plotter.vecTo(Direction.RIGHT, 4);

    expect(plotter.x).toBe(4);
    expect(plotter.y).toBe(0);

    plotter.vecTo(Direction.DOWN, 3);

    expect(plotter.x).toBe(4);
    expect(plotter.y).toBe(3);

    expect(getPoints(shape)).toEqual([
      [0, 0],
      [4, 0],
      [4, 3],
    ]);
  });

  test('vecTo with an arbitrary vector and scalar', () => {
    const plotter = new Plotter(new THREE.Shape());

    plotter.vecTo(new Vector2d(2, -1), 1.5);

    expect(plotter.x).toBeCloseTo(3);
    expect(plotter.y).toBeCloseTo(-1.5);
  });

  test('lineToAbs sets the cursor to absolute coordinates', () => {
    const shape = new THREE.Shape();
    const plotter = new Plotter(shape);

    plotter.lineTo(5, 5);
    plotter.lineToAbs(1, 2);

    expect(plotter.x).toBe(1);
    expect(plotter.y).toBe(2);

    expect(getPoints(shape)).toEqual([
      [0, 0],
      [5, 5],
      [1, 2],
    ]);
  });

  test('lineToAbs followed by relative lineTo uses the absolute cursor as base', () => {
    const plotter = new Plotter(new THREE.Shape());

    plotter.lineToAbs(10, 10);
    plotter.lineTo(5, -3);

    expect(plotter.x).toBe(15);
    expect(plotter.y).toBe(7);
  });

  test('exposes the shape it was constructed with', () => {
    const shape = new THREE.Shape();
    const plotter = new Plotter(shape);

    expect(plotter.shape).toBe(shape);
  });
});
