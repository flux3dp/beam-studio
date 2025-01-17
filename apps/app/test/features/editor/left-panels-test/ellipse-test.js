const { checkExist, setReload } = require('../../../util/utils');
const { pageCoordtoCanvasCoord } = require('../../../util/editor-utils');
const { mouseAction } = require('../../../util/actions');

test('Check Draw Ellipse', async function () {
  let { app } = require('../../../test');
  await setReload();
  await checkExist('#svgcanvas', 15000);

  const elli = await app.client.$('#left-Ellipse');
  await elli.click();

  await mouseAction([
    { type: 'pointerMove', x: 400, y: 400, duration: 100, },
    { type: 'pointerDown', button: 0, },
    { type: 'pointerMove', x: 464, y: 464, duration: 1000, },
    { type: 'pointerUp', button: 0, },
  ]);
  await checkExist('#svg_1');

  const startPoint = await pageCoordtoCanvasCoord({ x: 400, y: 400 });
  const endPoint = await pageCoordtoCanvasCoord({ x: 464, y: 464 });
  let expectedX = startPoint.x;
  let expectedY = startPoint.y;
  let expectedW = Math.pow(endPoint.x - startPoint.x, 2);
  let expectedH = Math.pow(endPoint.y - startPoint.y, 2);
  let expectedR = Math.sqrt(expectedW + expectedH) / Math.sqrt(2);

  const svgCx = await app.client.$('#svg_1');
  const actualCx = await svgCx.getAttribute('cx');

  const svgCy = await app.client.$('#svg_1');
  const actualCy = await svgCy.getAttribute('cy');

  const svgRx = await app.client.$('#svg_1');
  const actualR = await svgRx.getAttribute('rx');

  const cx = parseFloat(actualCx).toFixed(10);
  const cy = parseFloat(actualCy).toFixed(10);
  const rx = parseFloat(actualR).toFixed(10);

  expect(Math.abs(expectedX - cx)).toBeLessThanOrEqual(1e-10);
  expect(Math.abs(expectedY - cy)).toBeLessThanOrEqual(1e-10);
  expect(Math.abs(expectedR - rx)).toBeLessThanOrEqual(1e-10);
});
