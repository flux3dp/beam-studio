const { checkExist, setReload } = require('../../../../util/utils');

test('Check Reset Parameter', async function () {
  const { app } = require('../../../../test');
  await setReload();
  await checkExist('#svgcanvas', 15000);

  const set = await app.client.$('div.right');
  await set.click();

  const add = await app.client.$('div#add_bar3');
  await add.click();

  const textInput = await app.client.$('input.text-input');
  await textInput.click();
  await app.client.keys(['TEST', 'Space', 'RESET', 'Enter', "NULL"]);

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

  const w3cut = await app.client.$('#wood_3mm_cutting');
  await w3cut.click();

  for (let n = 0; n < 16; n++) {
    const removeSelect = await app.client.$('div#removeselect');
    await removeSelect.click();
  };
  const save = await app.client.$('button.btn.btn-default.primary');
  await save.click();

  const laserList = await app.client.execute(() => {
    const laserConfig = $('#laser-config-dropdown').children().length;
    return laserConfig;
  });
  expect(laserList).toEqual(4);

  const customSelect = await app.client.$('option[value="TEST RESET"]');
  expect(await customSelect.isExisting()).toEqual(true);
  await set.click();

  const reset = await app.client.$('button#laser_reset');
  await reset.click();

  const checkReset = await app.client.$('[data-test-key=" 是"]');
  await checkReset.click();

  const saveReset = await app.client.$('button#laser_save_and_exit');
  await saveReset.click();
  expect(await customSelect.isExisting()).toEqual(true);

  const resetList = await app.client.execute(() => {
    const laserConfig = $('#laser-config-dropdown').children().length;
    return laserConfig;
  });
  expect(resetList).toEqual(20);
});
