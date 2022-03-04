const { checkExist, setReload, md5 } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

describe('Verify Text Tool', () => {
  beforeEach(() => {
    setReload();
    checkExist('#svgcanvas', 15000);
  });

  test('Check Create Text ', async function () {
    const { app } = require('../../../test');
    const text = await app.client.$('#left-Text');
    await text.click();
    typing();
    const svg = await app.client.$('#svg_1');
    expect(await svg.getText()).toEqual('TEST');
  });

  test('Check Text Font Style', async function () {
    const { app } = require('../../../test');
    const text = await app.client.$('#left-Text');
    await text.click();
    typing();

    if (process.platform === 'darwin') {
      const optionStyle = await app.client.$('option[value="Medium"]');
      await optionStyle.click();
      const svg = await app.client.$('#svg_1');
      const textStyle = await svg.getAttribute('font-postscript');
      expect(textStyle).toEqual('STHeitiTC-Medium');
    } else {
      const optionStyle = await app.client.$('option[value="Bold"]');
      await optionStyle.click();
      const svg = await app.client.$('#svg_1');
      const textStyle = await svg.getAttribute('font-postscript');
      expect(textStyle).toEqual('MicrosoftJhengHeiBold');
    };
  });

  test('Check Text Font Family', async function () {
    const { app } = require('../../../test');
    const text = await app.client.$('#left-Text');
    await text.click();
    typing();

    if (process.platform === 'darwin') {
      const select = await app.client.$('div.react-select__input > input');
      await select.doubleClick();
      app.client.keys(['Al Nile', 'Enter', "NULL"]);
      const svg = await app.client.$('#svg_1');
      const textFont = await svg.getAttribute('font-family');
      expect(textFont).toEqual("'AlNile'");
    } else {
      const optionfont = await app.client.$('option[value="標楷體"]');
      await optionfont.click();
      const svg = await app.client.$('#svg_1');
      const textFont = await svg.getAttribute('font-family');
      expect(textFont).toEqual('標楷體');
    };
  });

  test('Check Text Font Size', async function () {
    const { app } = require('../../../test');
    const text = await app.client.$('#left-Text');
    await text.click();
    typing();
    const sizeInput = await app.client.$('input#font_size');
    await sizeInput.doubleClick();
    await app.client.keys(['Backspace', 'Backspace', 'Backspace', '1', '5', '0', 'Enter', "NULL"]);
    const svg = await app.client.$('#svg_1');
    const fontSize = await svg.getAttribute('font-size');
    expect(fontSize).toEqual('150');
  });

  test('Check Text Font Letter Spacing', async function () {
    const { app } = require('../../../test');
    const text = await app.client.$('#left-Text');
    await text.click();
    typing();
    const spacingInput = await app.client.$('input#letter_spacing');
    await spacingInput.doubleClick();
    await app.client.keys(['Backspace', '1', '.', '5', 'Enter', "NULL"]);
    const svg = await app.client.$('#svg_1');
    const letterSpacing = await svg.getAttribute('letter-spacing');
    expect(letterSpacing).toEqual('1.5em');
  });

  test('Check Text Line Spacing', async function () {
    const { app } = require('../../../test');
    const text = await app.client.$('#left-Text');
    await text.click();
    typing();
    const svg = await app.client.$('#svg_1');
    await svg.doubleClick();
    await app.client.keys(['Shift', 'Enter', 'SPACING', "NULL"]);
    const spacingInput = await app.client.$('input#line_spacing');
    await spacingInput.doubleClick();
    await app.client.keys(['Backspace', '2', 'Enter', "NULL"]);
    const lineSpacing = await svg.getAttribute('data-line-spacing');
    expect(lineSpacing).toEqual('2');
  });

  test('Check Text Vertical', async function () {
    const { app } = require('../../../test');
    const text = await app.client.$('#left-Text');
    await text.click();
    typing();
    const vertiSwitch = await app.client.$('div#vertical_text.onoffswitch');
    await vertiSwitch.click();
    const svg = await app.client.$('#svg_1');
    const vertiText = await svg.getAttribute('data-verti');
    expect(vertiText).toEqual('true');
  });

  test('Check Text Infill', async function () {
    const { app } = require('../../../test');
    const text = await app.client.$('#left-Text');
    await text.click();
    typing();
    const infillSwitch = await app.client.$('div#infill.onoffswitch');
    await infillSwitch.click();
    const svg = await app.client.$('#svg_1');
    const infillText = await svg.getAttribute('fill-opacity');
    expect(infillText).toEqual('1');
  });

  test('Check Text Convert To Path', async function () {
    const { app } = require('../../../test');
    const text = await app.client.$('#left-Text');
    await text.click();
    typing();
    const pathButton = await app.client.$('button#convert_to_path');
    await pathButton.click();
    await checkExist('#svg_2', 2000);
    const svg = await app.client.$('#svg_2');
    const svgD = await svg.getAttribute('d');
    expect(await md5(svgD)).toEqual('e9a2e7d2f058fafdc848814a48ed9d5f');
  });

  function typing() {
    const { app } = require('../../../test');
    mouseAction([
      { type: 'pointerMove', x: 300, y: 300, duration: 10, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerUp', button: 0, },
    ]);
    app.client.keys(['T', 'E', 'S', 'T', "NULL"]);
    checkExist('#svg_1');
  };
});
