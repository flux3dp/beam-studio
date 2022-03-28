const { checkExist, setReload } = require('../../../../util/utils');

test('Check Custom Parameter', async function () {
  const { app } = require('../../../../test');
  await setReload();
  await checkExist('#svgcanvas', 15000);

  const set = await app.client.$('div.right');
  await set.click();

  const add = await app.client.$('div#add_bar3');
  await add.click();

  const textInput = await app.client.$('input.text-input');
  await textInput.click();
  await app.client.keys(['TEST', 'Space', 'CUSTOM', 'Enter', "NULL"]);

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

  const w5cut = await app.client.$('#wood_5mm_cutting');
  await w5cut.click();

  const rew5cut = await app.client.$('div#removeselect');
  await rew5cut.click();

  const a5cut = await app.client.$('#acrylic_5mm_cutting');
  await a5cut.click();

  const rea5cut = await app.client.$('div#removeselect');
  await rea5cut.click();

  const l5cut = await app.client.$('#leather_5mm_cutting');
  await l5cut.click();

  const rel5cut = await app.client.$('div#removeselect');
  await rel5cut.click();

  const f5cut = await app.client.$('#fabric_5mm_cutting');
  await f5cut.click();

  const ref5cut = await app.client.$('div#removeselect');
  await ref5cut.click();

  const save = await app.client.$('button.btn.btn-default.primary');
  await save.click();

  const wood5cut = await app.client.$('option[value="木板 - 5mm 切割"]');
  await wood5cut.isExisting()
  expect(await wood5cut.isExisting()).toEqual(false);

  const acrylic5cut = await app.client.$('option[value="壓克力 - 5mm 切割"]');
  expect(await acrylic5cut.isExisting()).toEqual(false);

  const leather5cut = await app.client.$('option[value="皮革 - 5mm 切割"]');
  expect(await leather5cut.isExisting()).toEqual(false);

  const fabric5cut = await app.client.$('option[value="布料 - 5mm 切割"]');
  expect(await fabric5cut.isExisting()).toEqual(false);

  const custom = await app.client.$('option[value="TEST CUSTOM"]');
  expect(await custom.isExisting()).toEqual(true);
});
