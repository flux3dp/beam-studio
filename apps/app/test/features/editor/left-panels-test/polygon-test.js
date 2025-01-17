const { checkExist, setReload, md5 } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

describe('Verify Polygon Tool', () => {
  beforeEach(() => {
    setReload();
    checkExist('#svgcanvas', 15000);
  });

  test('Check Draw Polygon', async function () {
    const { app } = require('../../../test');
    const polygon = await app.client.$('#left-Polygon');
    await polygon.click();

    await mouseAction([
      { type: 'pointerMove', x: 500, y: 500, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 600, y: 600, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');

    const svgD = await app.client.$('#svg_1');
    const path = svgD.getAttribute('d');
    expect(await md5(path)).toEqual('d41d8cd98f00b204e9800998ecf8427e');
  });

  test('Check Sides by Keyboard', async function () {
    const { app } = require('../../../test');
    const poly = await app.client.$('#left-Polygon');
    await poly.click();

    await mouseAction([
      { type: 'pointerMove', x: 200, y: 200, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 250, y: 250, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');
    await app.client.keys(['=', "NULL"]);

    const poly2 = await app.client.$('#left-Polygon');
    await poly2.click();
    await mouseAction([
      { type: 'pointerMove', x: 350, y: 350, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
    await app.client.keys(['-', "NULL"]);

    const svgSide = await app.client.$('#svg_1');
    const actualSide = await svgSide.getAttribute('sides');
    expect(actualSide).toEqual("6");

    const svgSide2 = await app.client.$('#svg_2');
    const actualSide2 = await svgSide2.getAttribute('sides');
    expect(actualSide2).toEqual("4");
  });

  test('Check Sides by Setting Input', async function () {
    const { app } = require('../../../test');
    const poly = await app.client.$('#left-Polygon');
    await poly.click();

    await mouseAction([
      { type: 'pointerMove', x: 200, y: 200, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 250, y: 250, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');

    const input = await app.client.$('div.option-input');
    await input.doubleClick();
    await app.client.keys(['Backspace', 'Backspace', '6', 'Enter', 'NULL']);

    const poly2 = await app.client.$('#left-Polygon');
    await poly2.click();
    await mouseAction([
      { type: 'pointerMove', x: 350, y: 350, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
    await input.doubleClick();
    await app.client.keys(['Backspace', '4', 'Enter', "NULL"]);

    const svgSide = await app.client.$('#svg_1');
    const actualSide = await svgSide.getAttribute('sides');
    expect(actualSide).toEqual("6");

    const svgSide2 = await app.client.$('#svg_2');
    const actualSide2 = await svgSide2.getAttribute('sides');
    expect(actualSide2).toEqual("4");
  });
});
