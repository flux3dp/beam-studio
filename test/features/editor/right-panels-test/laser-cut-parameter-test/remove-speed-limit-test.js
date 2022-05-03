const { checkExist, checkNotExist, setAppPage, checknotExist } = require('../../../../util/utils');
const { mouseAction } = require('../../../../util/actions');

test('Check Remove Speed Limit', async function () {
  const { app } = require('../../../../test');
  await setAppPage('#studio/settings');

  const speedLimit = await app.client.$('#set-vector-speed-contraint option[value="FALSE"]');
  await speedLimit.click();
  expect(await speedLimit.getAttribute('value')).toEqual('FALSE');

  const done = await app.client.$('div.btn.btn-done');
  await done.click();
  await checkExist('#svgcanvas', 15000);
  const rect = await app.client.$('#left-Rectangle');
  await rect.click();
  await mouseAction([
    { type: 'pointerMove', x: 300, y: 300, duration: 100, },
    { type: 'pointerDown', button: 0, },
    { type: 'pointerMove', x: 500, y: 500, duration: 1000, },
    { type: 'pointerUp', button: 0, },
  ]);
  const switchLayer = await app.client.$('div.tab.layers');
  await switchLayer.click();

  const speedInput = await app.client.$('input#speed');
  await speedInput.doubleClick();
  await app.client.keys(['Delete', '1', '5', '0', 'Enter', "NULL"]);
  await checkNotExist('div.warning-text');
});
