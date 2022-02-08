const { checkExist, setReload } = require('../../../util/utils');
const { pageCoordtoCanvasCoord } = require('../../../util/editor-utils');
const { mouseAction } = require('../../../util/actions');

describe('Verify Rectangle Tool', () => {
  beforeEach(() => {
    setReload();
    checkExist('#svgcanvas', 15000);
  });

  test('Check Draw Rectangle', async function () {
    const { app } = require('../../../test');
    const rect = await app.client.$('#left-Rectangle');
    await rect.click();
    drawing();

    const startPoint = await pageCoordtoCanvasCoord({ x: 300, y: 300 });
    const endPoint = await pageCoordtoCanvasCoord({ x: 500, y: 500 });
    let expectedX = startPoint.x;
    let expectedY = startPoint.y;
    let expectedW = endPoint.x - startPoint.x;
    let expectedH = endPoint.y - startPoint.y;
    const svgX1 = await app.client.$('#svg_1');
    const actualX = await svgX1.getAttribute('x');

    const svgY1 = await app.client.$('#svg_1');
    const actualY = await svgY1.getAttribute('y');

    const svgW1 = await app.client.$('#svg_1');
    const actualW = await svgW1.getAttribute('width');

    const svgH1 = await app.client.$('#svg_1');
    const actualH = await svgH1.getAttribute('height');

    expect(Math.abs(expectedX - actualX)).toBeLessThanOrEqual(0);
    expect(Math.abs(expectedY - actualY)).toBeLessThanOrEqual(0);
    expect(Math.abs(expectedW - actualW)).toBeLessThanOrEqual(0);
    expect(Math.abs(expectedH - actualH)).toBeLessThanOrEqual(0);
  });

  test('Check Rectangle Corner', async function () {
    const { app } = require('../../../test');
    const rect = await app.client.$('#left-Rectangle');
    await rect.click();
    drawing();

    const cornerInput = await app.client.$('div.option-input.ui.ui-control-unit-input-v2');
    await cornerInput.doubleClick();

    await app.client.keys(['Backspace', '10', 'Enter', "NULL"]);
    await new Promise((r) => setTimeout(r, 1000));

    const infillSwitch = await app.client.$('div.onoffswitch');
    await infillSwitch.click();

    const svgRX = await app.client.$('#svg_1');
    const actualCorner = await svgRX.getAttribute('rx');

    const svgFill = await app.client.$('#svg_1');
    const actualInfill = await svgFill.getAttribute('fill-opacity');

    expect(actualCorner).toEqual("100");
    expect(actualInfill).toEqual("1");
  });

  function drawing() {
    mouseAction([
      { type: 'pointerMove', x: 300, y: 300, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 500, y: 500, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
    checkExist('#svg_1');
  };
});
