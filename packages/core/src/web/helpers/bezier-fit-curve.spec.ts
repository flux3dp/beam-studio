import { fitPath } from './bezier-fit-curve';

test('test bezier-fit-curve', () => {
  const result = fitPath([
    { x: 0, y: 0 },
    { x: 40, y: 60 },
    { x: -50, y: 90 },
    { x: 0, y: 200 },
  ]);

  expect(result.length).toBe(3);
  expect(result[0]).toEqual({ type: 'L', points: [{ x: 0, y: 0 }, { x: 40, y: 60 }] });
  expect(result[1]).toEqual({ type: 'L', points: [{ x: 40, y: 60 }, { x: -50, y: 90 }] });
  expect(result[2]).toEqual({ type: 'L', points: [{ x: -50, y: 90 }, { x: 0, y: 200 }] });
});
