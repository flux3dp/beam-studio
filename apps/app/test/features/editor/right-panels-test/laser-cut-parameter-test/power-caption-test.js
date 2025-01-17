const { checkExist, setReload } = require('../../../../util/utils');

test('Change Power Caption', async function () {
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

  await new Promise((r) => setTimeout(r, 1000));
  await checkExist('div#power-caption', 15000);

  const next = await app.client.$('button.btn.btn-default.primary');
  await next.click();
});
