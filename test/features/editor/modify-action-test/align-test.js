const { checkExist, setReload } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

describe('Verify Align Tool', () => {
  beforeEach(() => {
    setReload();
    checkExist('#svgcanvas', 15000);
  });

  test('Check Top Align', async function () {
    const { app } = require('../../../test');
    await drawing();
    await selectAll();
    const topAlign = await app.client.$('#top_align');
    await topAlign.click();

    const svg1 = await app.client.$('#svg_1');
    const svg2 = await app.client.$('#svg_2');
    const svg3 = await app.client.$('#svg_3');
    expect(await svg1.getLocation('y')).toEqual(await svg2.getLocation('y'));
    expect(await svg1.getLocation('y')).toEqual(await svg3.getLocation('y'));
  });

  test('Check Middle Align', async function () {
    const { app } = require('../../../test');
    await drawing();
    await selectAll();
    const middleAlign = await app.client.$('#middle_align');
    await middleAlign.click();

    const svg1 = await app.client.$('#svg_1');
    const svg2 = await app.client.$('#svg_2');
    const svg3 = await app.client.$('#svg_3');
    expect(await svg1.getLocation('y')).toEqual(await svg2.getLocation('y'));
    expect(await svg1.getLocation('y')).toEqual(await svg3.getLocation('y'));
  });

  test('Check Bottom Align', async function () {
    const { app } = require('../../../test');
    await drawing();
    await selectAll();
    const bottomAlign = await app.client.$('#bottom_align');
    await bottomAlign.click();

    const svg1 = await app.client.$('#svg_1');
    const svg2 = await app.client.$('#svg_2');
    const svg3 = await app.client.$('#svg_3');
    expect(await svg1.getLocation('y')).toEqual(await svg2.getLocation('y'));
    expect(await svg1.getLocation('y')).toEqual(await svg3.getLocation('y'));
  });

  test('Check Left Align', async function () {
    const { app } = require('../../../test');
    await drawing();
    await selectAll();
    const leftAlign = await app.client.$('#left_align');
    await leftAlign.click();

    const svg1 = await app.client.$('#svg_1');
    const svg2 = await app.client.$('#svg_2');
    const svg3 = await app.client.$('#svg_3');
    expect(await svg1.getLocation('x')).toEqual(await svg2.getLocation('x'));
    expect(await svg1.getLocation('x')).toEqual(await svg3.getLocation('x'));
  });

  test('Check Center Align', async function () {
    const { app } = require('../../../test');
    await drawing();
    await selectAll();
    const centerAlign = await app.client.$('#center_align');
    await centerAlign.click();

    const svg1 = await app.client.$('#svg_1');
    const svg2 = await app.client.$('#svg_2');
    const svg3 = await app.client.$('#svg_3');
    expect(await svg1.getLocation('x')).toEqual(await svg2.getLocation('x'));
    expect(await svg1.getLocation('x')).toEqual(await svg3.getLocation('x'));
  });

  test('Check Right Align', async function () {
    const { app } = require('../../../test');
    await drawing();
    await selectAll();
    const rightAlign = await app.client.$('#right_align');
    await rightAlign.click();

    const svg1 = await app.client.$('#svg_1');
    const svg2 = await app.client.$('#svg_2');
    const svg3 = await app.client.$('#svg_3');
    expect(await svg1.getLocation('x')).toEqual(await svg2.getLocation('x'));
    expect(await svg1.getLocation('x')).toEqual(await svg3.getLocation('x'));
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
      { type: 'pointerMove', x: 350, y: 350, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
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
  };

  async function selectAll() {
    const { app } = require('../../../test');
    const select = await app.client.$('#left-Cursor');
    await select.click();
    await mouseAction([
      { type: 'pointerMove', x: 100, y: 100, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 600, y: 600, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
  };
});
