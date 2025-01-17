const { checkExist, setReload } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

describe('Verify Group Layer Tool', () => {
  beforeEach(() => {
    setReload();
    checkExist('#svgcanvas', 15000);
  });

  test('Check Group Layer', async function () {
    const { app } = require('../../../test');
    await doAllThing();
    const svg1 = await app.client.$('#svg_1');
    const svg2 = await app.client.$('#svg_2');
    expect(await svg1.getAttribute('stroke')).not.toEqual(await svg2.getAttribute('stroke'));
    await selectAll();
    const group = await app.client.$('#group');
    await group.click();
    expect(await svg1.getAttribute('stroke')).toEqual(await svg2.getAttribute('stroke'));
  });

  test('Check Unroup Layer', async function () {
    const { app } = require('../../../test');
    await doAllThing();
    await selectAll();
    const group = await app.client.$('#group');
    await group.click();
    await selectAll();
    const unGroup = await app.client.$('#ungroup');
    await unGroup.click();
    await selectAll();
    const svg1 = await app.client.$('#svg_1');
    const svg2 = await app.client.$('#svg_2');
    expect(await svg1.getAttribute('stroke')).not.toEqual(await svg2.getAttribute('stroke'));
    expect(await svg1.getAttribute('stroke')).toEqual('#333333');
  });

  async function doAllThing() {
    const { app } = require('../../../test');
    const rect = await app.client.$('#left-Rectangle');//
    await rect.click();
    await mouseAction([
      { type: 'pointerMove', x: 200, y: 200, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 250, y: 250, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');

    const switchLayer = await app.client.$('div.tab.layers');
    await switchLayer.click();
    const addLayer = await app.client.$('div.add-layer-btn');
    await addLayer.click();
    await switchLayer.click();
    await checkExist('[data-test-key="layer-1"]');

    const elli = await app.client.$('#left-Ellipse');
    await elli.click();
    await mouseAction([
      { type: 'pointerMove', x: 300, y: 300, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 364, y: 364, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_2');
    await switchLayer.click();
  };

  async function selectAll(){
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
