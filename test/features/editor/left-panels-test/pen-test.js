const { checkExist, setReload, md5 } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

describe('Verify Pen Tool', () => {
  beforeEach(() => {
    setReload();
    checkExist('#svgcanvas', 15000);
  });

  test('Check Draw graph', async function () {
    const { app } = require('../../../test');
    const pen = await app.client.$('#left-Pen');
    await pen.click();

    await mouseAction([
      { type: 'pointerMove', x: 200, y: 200, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerUp', button: 0, },
      { type: 'pointerMove', x: 250, y: 200, duration: 1000, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerUp', button: 0, },
      { type: 'pointerMove', x: 300, y: 200, duration: 1000, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerUp', button: 0, },
      { type: 'pointerMove', x: 300, y: 250, duration: 1000, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerUp', button: 0, },
      { type: 'pointerMove', x: 300, y: 300, duration: 1000, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerUp', button: 0, },
      { type: 'pointerMove', x: 250, y: 300, duration: 1000, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerUp', button: 0, },
      { type: 'pointerMove', x: 200, y: 300, duration: 1000, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerUp', button: 0, },
      { type: 'pointerMove', x: 200, y: 250, duration: 1000, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerUp', button: 0, },
      { type: 'pointerMove', x: 200, y: 200, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerDown', button: 0, },
    ]);
    await checkExist('#svg_1');

    const svgD = await app.client.$('#svg_1');
    const pend = await svgD.getAttribute('d');
    expect(await md5(pend)).toEqual('fb254ce440baff4db7fb4a2759f5fe1b');
  });

  test('Check Draw Curve', async function () {
    const { app } = require('../../../test');
    const pen = await app.client.$('#left-Pen');
    await pen.click();

    await mouseAction([
      { type: 'pointerMove', x: 400, y: 250, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 250, y: 400, duration: 1000, },
      { type: 'pointerUp', button: 0, },
      { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 300, y: 450, duration: 1000, },
      { type: 'pointerUp', button: 0, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerDown', button: 0, },
    ]);
    await checkExist('#svg_1');

    const svgD = await app.client.$('#svg_1');
    const curve = await svgD.getAttribute('d');
    expect(await md5(curve)).toEqual('36f0381d4320f8fdfaded311a561b54a');
  });

  test('Check Path Edit Panel by Doubleclicks', async function () {
    const { app } = require('../../../test');
    const pen = await app.client.$('#left-Pen');
    await pen.click();
    drawing();
    const pathPointer = await app.client.$('#pathpointgrip_1');
    await pathPointer.doubleClick();

    await checkExist('#pathedit-panel');
    await checkExist('[title="tCorner"]');
    await checkExist('[title="tSmooth"]');
    await checkExist('[title="tSymmetry"]');
  });

  test('Check Draw Pen with tCorner', async function () {
    const { app } = require('../../../test');
    const pen = await app.client.$('#left-Pen');
    await pen.click();
    drawing();

    const pathPoint = await app.client.$('#pathpointgrip_1');
    await pathPoint.doubleClick();
    const ctrlPoint = await app.client.$('#ctrlpointgrip_1c1');
    await ctrlPoint.click();
    await ctrlPoint.dragAndDrop({ x: -100, y: -150 });

    const ctrlPointMove = await app.client.$('#ctrlpointgrip_2c1');
    await ctrlPointMove.dragAndDrop({ x: 100, y: -150 });

    const svgD = await app.client.$('#svg_1');
    const curve = await svgD.getAttribute('d');
    expect(await md5(curve)).toEqual('3131e185e4567d68e355625b46dc9df2');
  });

  test('Check Draw Pen with tSmooth', async function () {
    const { app } = require('../../../test');
    const pen = await app.client.$('#left-Pen');
    await pen.click();
    drawing();

    const pathPoint = await app.client.$('#pathpointgrip_1');
    await pathPoint.doubleClick();
    const ctrlPoint = await app.client.$('#ctrlpointgrip_1c1');
    await ctrlPoint.click();
    await ctrlPoint.dragAndDrop({ x: -100, y: -150 });

    const ctrlPointMove = await app.client.$('#ctrlpointgrip_2c1');
    await ctrlPointMove.dragAndDrop({ x: 100, y: -150 });

    const smooth = await app.client.$('[title="tSmooth"]');
    await smooth.click();
    await ctrlPoint.dragAndDrop({ x: -50, y: -50 });

    const svgD = await app.client.$('#svg_1');
    const curve = await svgD.getAttribute('d');
    expect(await md5(curve)).toEqual('49cf86fac5fb0577c47bdf83f2c9cd09');
  });

  test('Check Draw Pen with tSymmetry', async function () {
    const { app } = require('../../../test');
    const pen = await app.client.$('#left-Pen');
    await pen.click();
    drawing();
    const pathPoint = await app.client.$('#pathpointgrip_1');
    await pathPoint.doubleClick();
    const ctrlPoint = await app.client.$('#ctrlpointgrip_1c1');
    await ctrlPoint.click();
    await ctrlPoint.dragAndDrop({ x: -100, y: -150 });

    const ctrlPointMove = await app.client.$('#ctrlpointgrip_2c1');
    await ctrlPointMove.dragAndDrop({ x: 100, y: -150 });

    const symmetry = await app.client.$('[title="tSymmetry"]');
    await symmetry.click();
    await ctrlPointMove.dragAndDrop({ x: 0, y: -100 });

    const svgD = await app.client.$('#svg_1');
    const curve = await svgD.getAttribute('d');
    expect(await md5(curve)).toEqual('0a7f5abcd39c902492500f277b3b8957');
  });

  function drawing() {
    mouseAction([
      { type: 'pointerMove', x: 400, y: 400, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerUp', button: 0, },
      { type: 'pointerMove', x: 450, y: 350, duration: 1000, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerUp', button: 0, },
      { type: 'pointerMove', x: 500, y: 400, duration: 1000, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerUp', button: 0, },
      { type: 'pointerMove', x: 550, y: 350, duration: 1000, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerUp', button: 0, },
      { type: 'pointerMove', x: 600, y: 400, duration: 1000, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerDown', button: 0, },
    ]);
    checkExist('#svg_1');
  };
});
