const { checkExist, setReload } = require('../../../../util/utils');

test('Check Add Parameter', async function () {
  const { app } = require('../../../../test');
  await setReload();
  await checkExist('#svgcanvas', 15000);

  const set = await app.client.$('div.right');
  await set.click();

  const add = await app.client.$('div#add_bar3');
  await add.click();

  const textInput = await app.client.$('input.text-input');
  await textInput.click();
  await app.client.keys(['TEST', 'Space', 'ADD', 'Space', 'PARAMETER', 'Enter', "NULL"]);

  const powerInput = await app.client.$('input#laser_power');
  await powerInput.doubleClick();
  await app.client.keys(['Delete', '9', '5', 'Enter', "NULL"]);

  const speedInput = await app.client.$('input#laser_speed');
  await speedInput.doubleClick();
  await app.client.keys(['Delete', '1', '5', '0', 'Enter', "NULL"]);

  const repeatInput = await app.client.$('input#laser_repeat');
  await repeatInput.doubleClick();
  await app.client.keys(['Delete', '3', 'Enter', "NULL"]);

  const zStepInput = await app.client.$('input#laser_zStep');
  await zStepInput.doubleClick();
  await app.client.keys(['Delete', '1', '0', 'Enter', "NULL"]);
  await new Promise((r) => setTimeout(r, 1000));

  const next = await app.client.$('button.btn.btn-default.primary');
  await next.click();

  const option = await app.client.$('option[value="TEST ADD PARAMETER"]');
  await option.click();

  const power = await app.client.$('#power');
  const speed = await app.client.$('#speed');
  const repeat = await app.client.$('#repeat');
  expect(await power.getAttribute('value')).toEqual('95');
  expect(await speed.getAttribute('value')).toEqual('150');
  expect(await repeat.getAttribute('value')).toEqual('3');
});
