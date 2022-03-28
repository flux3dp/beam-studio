const { checkExist, setReload } = require('../../../../util/utils');

test('Check Power Enter Text', async function () {
  const { app } = require('../../../../test');
  await setReload();
  await checkExist('#svgcanvas', 15000);

  const powerInput = await app.client.$('input#power');
  await powerInput.doubleClick();
  await app.client.keys(['Backspace', '7', '5', 'Enter', "NULL"]);

  expect(await powerInput.getAttribute('value')).toEqual('75');
  await new Promise((r) => setTimeout(r, 1000));

  const goButton = await app.client.$('div.go-button-container');
  await goButton.click();

  const modalInput = await app.client.$('input#power-caption');
  await modalInput.addValue('知道了');

  const next = await app.client.$('button.btn.btn-default.primary');
  await next.click();

  await checkExist('div.flux-monitor');
  await new Promise((r) => setTimeout(r, 1000));
});
