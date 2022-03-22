const { checkExist, setReload, md5 } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');


describe('Verify Object Tool', () => {
  beforeEach(() => {
    setReload();
    checkExist('#svgcanvas', 15000);
  });

  test('Check Move Object', async function () {
    const { app } = require('../../../test');
    await drawing();
    const svg = await app.client.$('#svg_1');

    const xInput = await app.client.$('input#x_position');
    await xInput.doubleClick();
    await app.client.keys(['Backspace', '6', '0', 'Enter', "NULL"]);

    const yInput = await app.client.$('input#y_position');
    await yInput.doubleClick();
    await app.client.keys(['Backspace', '6', '0', 'Enter', "NULL"]);

    if (process.platform === 'darwin') {
      expect(await svg.getLocation('x')).toBeCloseTo(320, 1);
    } else {
      expect(await svg.getLocation('x')).toBeCloseTo(323.77, 1);
    };

    if (process.platform === 'darwin') {
      expect(await svg.getLocation('y')).toBeCloseTo(231.75, 1);
    } else {
      expect(await svg.getLocation('y')).toBeCloseTo(253.3, 1);
    };
  });

  test('Check Rotate Object', async function () {
    const { app } = require('../../../test');
    await drawing();
    const rotateInput = await app.client.$('input#rotate');
    await rotateInput.doubleClick();
    await app.client.keys(['Backspace', '4', '5', 'Enter', "NULL"]);
    const svg = await app.client.$('#svg_1');
    expect(await md5(await svg.getLocation('transfer'))).toEqual('d41d8cd98f00b204e9800998ecf8427e');
  });

  test('Check Zoom Object', async function () {
    const { app } = require('../../../test');
    await drawing();
    const ctorGrip = await app.client.$('circle#selectorGrip_resize_se');
    await ctorGrip.dragAndDrop({ x: 200, y: 200 });//zoom in

    const svg = await app.client.$('#svg_1');
    expect(await svg.getLocation('x')).toEqual(250);
    expect(await svg.getLocation('y')).toEqual(250);

    await ctorGrip.dragAndDrop({ x: -300, y: -300 });//zoom out
    expect(await svg.getSize('width')).toBeCloseTo(50, 1);
    expect(await svg.getSize('height')).toBeCloseTo(50, 1);
  });

  test('Check Infill Object', async function () {
    const { app } = require('../../../test');
    await drawing();
    const svg = await app.client.$('#svg_1');
    expect(await svg.getAttribute('fill')).toEqual('none');
    const fillSwitch = await app.client.$('div.onoffswitch');
    await fillSwitch.click();
    expect(await svg.getAttribute('fill')).toEqual('#333333');
  });

  test('Check Zoom Lock Object', async function () {
    const { app } = require('../../../test');
    await drawing();
    const fillSwitch = await app.client.$('div.onoffswitch');
    await fillSwitch.click();

    const lock = await app.client.$('div.dimension-lock');
    await lock.click();

    const ctorGrip = await app.client.$('circle#selectorGrip_resize_se');
    await ctorGrip.dragAndDrop({ x: -200, y: -200 });
    const svg = await app.client.$('#svg_1');
    expect(await svg.getAttribute('data-ratiofixed')).toEqual("true");
    expect(await svg.getSize('width')).toEqual(150);
    expect(await svg.getSize('height')).toEqual(150);
    expect(await svg.getLocation('x')).toEqual(100);
    expect(await svg.getLocation('y')).toEqual(100);
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
  };
});
