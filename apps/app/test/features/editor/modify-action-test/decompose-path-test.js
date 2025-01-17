const { checkExist, setReload } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Decompose Path', async function () {
  const { app } = require('../../../test');
  await setReload();
  await checkExist('#svgcanvas', 15000);

  const text = await app.client.$('#left-Text');
  await text.click();
  await mouseAction([
    { type: 'pointerMove', x: 300, y: 300, duration: 10, },
    { type: 'pointerDown', button: 0, },
    { type: 'pointerUp', button: 0, },
  ]);
  await app.client.keys(['DECOMPOSE', 'Space', 'PATH', 'Space', 'TEST']);
  await checkExist('#svg_1');

  const convertBtn = await app.client.$('button#convert_to_path');
  await convertBtn.click();

  const select = await app.client.$('#left-Cursor');
  await select.click();
  await mouseAction([
    { type: 'pointerMove', x: 200, y: 200, duration: 10, },
    { type: 'pointerDown', button: 0, },
    { type: 'pointerMove', x: 700, y: 500, duration: 1000, },
    { type: 'pointerUp', button: 0, },
  ]);

  const decomposeBtn = await app.client.$('button#decompose_path');
  await decomposeBtn.click();

  const result = await app.client.execute(() => {
    const groupVisible = svgCanvas.getVisibleElements();
    const groupLength = $('#svg_1').children().length;
    return { groupLength, groupVisible };
  });
  expect(result.groupLength).toEqual(0);
  expect(result.groupVisible.length).toEqual(24);
});
