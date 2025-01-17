const { checkExist, setReload } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

describe('Verify Distribute Tool', () => {
  beforeEach(() => {
    setReload();
    checkExist('#svgcanvas', 15000);
  });

  test('Check Vertical Distribute', async function () {
    const { app } = require('../../../test');
    await drawing();
    const vdistAlign = await app.client.$('#vdist');
    await vdistAlign.click();

    const svg1 = await app.client.$('#svg_1');
    const svg2 = await app.client.$('#svg_2');
    const svg3 = await app.client.$('#svg_3');

    const rectLocation1 = await svg2.getLocation('y') - await svg1.getLocation('y');
    const rectLocation2 = await svg3.getLocation('y') - await svg2.getLocation('y')
    expect(rectLocation1).toEqual(100);
    expect(rectLocation2).toEqual(100);
  });

  test('Check Horizontal Distribute', async function () {
    const { app } = require('../../../test');
    await drawing();
    const hdistAlign = await app.client.$('#hdist');
    await hdistAlign.click();

    const svg1 = await app.client.$('#svg_1');
    const svg2 = await app.client.$('#svg_2');
    const svg3 = await app.client.$('#svg_3');
    const rectLocation1 = await svg2.getLocation('x') - await svg1.getLocation('x');
    const rectLocation2 = await svg3.getLocation('x') - await svg2.getLocation('x')
    expect(rectLocation1).toEqual(100);
    expect(rectLocation2).toEqual(100);
  });

  async function drawing() {
    const { app } = require('../../../test');
    const rect = await app.client.$('#left-Rectangle');
    await rect.click();
    await mouseAction([
      { type: 'pointerMove', x: 250, y: 250, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 300, y: 300, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');

    await rect.click();
    await mouseAction([
      { type: 'pointerMove', x: 330, y: 330, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 380, y: 380, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_2');

    await rect.click();
    await mouseAction([
      { type: 'pointerMove', x: 450, y: 450, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 500, y: 500, duration: 1000, },
      { type: 'pointerUp', button: 0, },

      { type: 'pointerMove', x: 510, y: 510, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_3');

    await mouseAction([
      { type: 'pointerMove', x: 100, y: 100, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 600, y: 600, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
  };
});
