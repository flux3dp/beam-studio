const { checkExist, setReload, md5 } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

describe('Verify Boolean Operations Tool', () => {
  beforeEach(() => {
    setReload();
    checkExist('#svgcanvas', 15000);
  });

  test('Check Union', async function () {
    const { app } = require('../../../test');
    await drawing();
    await selectAll();
    const unino = await app.client.$('#union');
    await unino.click();
    await checkExist('#svg_4');
    const svg = await app.client.$('#svg_4');
    if (process.platform === 'darwin') {
      expect(await md5(await svg.getAttribute('d'))).toEqual('4a875293b656dc5a7e7be43d1709d87a');
    } else {
      expect(await md5(await svg.getAttribute('d'))).toEqual('b1e526438dcc7388753f19a98ec87322');
    };
  });

  test('Check Subtract', async function () {
    const { app } = require('../../../test');
    await drawing();
    await selectAll();
    const subtract = await app.client.$('#subtract');
    await subtract.click();
    await checkExist('#svg_4');
    const svg = await app.client.$('#svg_4');
    if (process.platform === 'darwin') {
      expect(await md5(await svg.getAttribute('d'))).toEqual('6b5c63ee2933dbe77f253e74b9b2a9aa');
    } else {
      expect(await md5(await svg.getAttribute('d'))).toEqual('37af94fb6da0ff9af9a4a41cc5ece58b');
    };
  });

  test('Check Intersect', async function () {
    const { app } = require('../../../test');
    await drawing();
    await selectAll();
    const intersect = await app.client.$('#intersect');
    await intersect.click();
    await checkExist('#svg_4');
    const svg = await app.client.$('#svg_4');
    if (process.platform === 'darwin') {
      expect(await md5(await svg.getAttribute('d'))).toEqual('150a9c9d4731ac7371d1416bfc3019d4');
    } else {
      expect(await md5(await svg.getAttribute('d'))).toEqual('a6fd3da1e545d731f7a2827dffd12d2d');
    };
  });

  test('Check Difference', async function () {
    const { app } = require('../../../test');
    await drawing();
    await selectAll();
    const difference = await app.client.$('#difference');
    await difference.click();
    await checkExist('#svg_4');
    const svg = await app.client.$('#svg_4');
    const fillSwitch = await app.client.$('div.onoffswitch');
    await fillSwitch.click();
    if (process.platform === 'darwin') {
      expect(await md5(await svg.getAttribute('d'))).toEqual('8a0e46b3015370669820de8112ed028e');
    } else {
      expect(await md5(await svg.getAttribute('d'))).toEqual('edd249ab8cafbb317428129eea5cfe59');
    };
  });

  async function drawing() {
    const { app } = require('../../../test');
    const rect = await app.client.$('#left-Rectangle');
    await rect.click();
    await mouseAction([
      { type: 'pointerMove', x: 200, y: 200, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 300, y: 300, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
    await rect.click();
    await mouseAction([
      { type: 'pointerMove', x: 250, y: 250, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 350, y: 350, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
  };
  async function selectAll() {
    const { app } = require('../../../test');
    const select = await app.client.$('#left-Cursor');
    await select.click();
    await mouseAction([
      { type: 'pointerMove', x: 100, y: 100, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
  };
});
