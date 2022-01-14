const { checkExist, setReload } = require('../../../util/utils');
const { pageCoordtoCanvasCoord } = require('../../../util/editor-utils');
const { mouseAction } = require('../../../util/actions');

test('Check Draw Line', async function () {
  const { app } = require('../../../test');
  await setReload();
  await checkExist('#svgcanvas', 15000);

  const line = await app.client.$('#left-Line');
  await line.click();

  await mouseAction([
    { type: 'pointerMove', x: 300, y: 300, duration: 100, },
    { type: 'pointerDown', button: 0, },
    { type: 'pointerMove', x: 500, y: 500, duration: 1000, },
    { type: 'pointerUp', button: 0, },
  ]);
  await checkExist('#svg_1');

  const startPoint = await pageCoordtoCanvasCoord({ x: 300, y: 300 });
  const endPoint = await pageCoordtoCanvasCoord({ x: 500, y: 500 });
  let expectedX1 = startPoint.x;
  let expectedY1 = startPoint.y;
  let expectedX2 = endPoint.x;
  let expectedY2 = endPoint.y;

  const eX1 = parseFloat(expectedX1).toFixed(10);
  const eY1 = parseFloat(expectedY1).toFixed(10);
  const eX2 = parseFloat(expectedX2).toFixed(10);
  const eY2 = parseFloat(expectedY2).toFixed(10);

  const svgX1 = await app.client.$('#svg_1');
  const actualX1 = await svgX1.getAttribute('x1');

  const svgY1 = await app.client.$('#svg_1');
  const actualY1 = await svgY1.getAttribute('y1');

  const svgX2 = await app.client.$('#svg_1');
  const actualX2 = await svgX2.getAttribute('x2');

  const svgY2 = await app.client.$('#svg_1');
  const actualY2 = await svgY2.getAttribute('y2');

  const aX1 = parseFloat(actualX1).toFixed(10);
  const aY1 = parseFloat(actualY1).toFixed(10);
  const aX2 = parseFloat(actualX2).toFixed(10);
  const aY2 = parseFloat(actualY2).toFixed(10);

  expect(Math.abs(eX1 - aX1)).toBeLessThanOrEqual(0);
  expect(Math.abs(eY1 - aY1)).toBeLessThanOrEqual(0);
  expect(Math.abs(eX2 - aX2)).toBeLessThanOrEqual(0);
  expect(Math.abs(eY2 - aY2)).toBeLessThanOrEqual(0);
});
