const { checkExist, setReload, md5 } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Offset', async function () {
  const { app } = require('../../../test');
  await setReload();
  await checkExist('#svgcanvas', 15000);

  const elli = await app.client.$('#left-Ellipse');
  await elli.click();
  await mouseAction([
    { type: 'pointerMove', x: 200, y: 200, duration: 100, },
    { type: 'pointerDown', button: 0, },
    { type: 'pointerMove', x: 264, y: 264, duration: 1000, },
    { type: 'pointerUp', button: 0, },
  ]);
  await checkExist('#svg_1');

  const line = await app.client.$('#left-Line');
  await line.click();
  await mouseAction([
    { type: 'pointerMove', x: 250, y: 150, duration: 100, },
    { type: 'pointerDown', button: 0, },
    { type: 'pointerMove', x: 190, y: 270, duration: 1000, },
    { type: 'pointerUp', button: 0, },
  ]);

  const select = await app.client.$('#left-Cursor');
  await select.click();
  await mouseAction([
    { type: 'pointerMove', x: 100, y: 100, duration: 100, },
    { type: 'pointerDown', button: 0, },
    { type: 'pointerMove', x: 350, y: 350, duration: 1000, },
    { type: 'pointerUp', button: 0, },
  ]);

  const offset = await app.client.$('button#offset');
  await offset.click();

  const confirm = await app.client.$('button.btn.btn-default.primary');
  await confirm.click();

  const svg = await app.client.$('#svg_4');
  if (process.platform === 'darwin') {
    expect(await md5(await svg.getAttribute('d'))).toEqual('820f6aeb3981fe79d3fe24436a479ef6');
  } else {
    expect(await md5(await svg.getAttribute('d'))).toEqual('a262656506c8c74c70eee1efb66ba589');
  };
});
