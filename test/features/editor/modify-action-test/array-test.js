const { checkExist, setReload, md5 } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

describe('Verify Array Tool', () => {
  beforeEach(() => {
    setReload();
    checkExist('#svgcanvas', 15000);
  });

  test('Check Array Text', async function () {
    const { app } = require('../../../test');
    const text = await app.client.$('#left-Text');
    await text.click();
    await mouseAction([
      { type: 'pointerMove', x: 300, y: 300, duration: 10, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerUp', button: 0, },
    ]);
    await app.client.keys(['ARRAY', 'Space', 'TEST']);
    await arrayAction();
    await checkSvg(1, 2, 4, 6);

    const svg1 = await app.client.$('#svg_1');
    const svg2 = await app.client.$('#svg_2');
    expect(await svg2.getText()).toEqual(await svg1.getText());
    expect(await svg2.getAttribute('x')).toEqual(await svg1.getAttribute('x'));
    expect((await svg2.getAttribute('y') - await svg1.getAttribute('y'))).toEqual(1000);

    const svg4 = await app.client.$('#svg_4');
    expect(await svg4.getText()).toEqual(await svg1.getText());
    expect(await svg4.getAttribute('y')).toEqual(await svg1.getAttribute('y'));
    expect((await svg4.getAttribute('x') - await svg1.getAttribute('x'))).toBeCloseTo(1000, 1);

    const svg6 = await app.client.$('#svg_6');
    expect(await svg6.getText()).toEqual(await svg1.getText());
    expect((await svg6.getAttribute('x') - await svg1.getAttribute('x'))).toBeCloseTo(1000, 1);
    expect((await svg6.getAttribute('y') - await svg1.getAttribute('y'))).toBeCloseTo(1000, 1);
  });

  test('Check Array Geometry', async function () {
    const { app } = require('../../../test');
    const polygon = await app.client.$('#left-Polygon');
    await polygon.click();
    await mouseAction([
      { type: 'pointerMove', x: 300, y: 300, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 350, y: 350, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
    await selectAll();
    await arrayAction();
    await checkSvg(1, 2, 3, 4);

    const svg1 = await app.client.$('#svg_1');
    if (process.platform === 'darwin') {
      expect(await md5(await svg1.getAttribute('points'))).toEqual('0a21e0abd587009da08f46593c2c6183');
    } else {
      expect(await md5(await svg1.getAttribute('points'))).toEqual('35b88ee3ad7bde88c0d769bb221e6f95');
    };

    const svg2 = await app.client.$('#svg_2');
    if (process.platform === 'darwin') {
      expect(await md5(await svg2.getAttribute('points'))).toEqual('b31bf8ac947dedcb0afdced39b33758d');
    } else {
      expect(await md5(await svg2.getAttribute('points'))).toEqual('518ea17047422146db7e1a90ac3c331f');
    };

    const svg3 = await app.client.$('#svg_3');
    if (process.platform === 'darwin') {
      expect(await md5(await svg3.getAttribute('points'))).toEqual('c613812d7ed4d32c9667f7746d7068fb');
    } else {
      expect(await md5(await svg3.getAttribute('points'))).toEqual('04220e92c9803d6ec12c23d6383ce5b5');
    };

    const svg4 = await app.client.$('#svg_4');
    if (process.platform === 'darwin') {
      expect(await md5(await svg4.getAttribute('points'))).toEqual('d6c21f49eb2170ba47ed478ccf43b73b');
    } else {
      expect(await md5(await svg4.getAttribute('points'))).toEqual('4829559a9101611ec2b9356ed0182a17');
    };
  });

  test('Check Array Path', async function () {
    const { app } = require('../../../test');
    const path = await app.client.$('#left-Line');
    await path.click();
    await mouseAction([
      { type: 'pointerMove', x: 300, y: 300, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 350, y: 350, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
    await selectAll();
    await arrayAction();
    await checkSvg(1, 2, 3, 4);

    const svg1 = await app.client.$('#svg_1');
    const pFsvg1 = parseFloat(await svg1.getAttribute('x1')).toFixed(7);
    const svg2 = await app.client.$('#svg_2');
    const pFsvg2 = parseFloat(await svg2.getAttribute('x1')).toFixed(7);
    expect(pFsvg2).toEqual(pFsvg1);
    expect((await svg2.getAttribute('y1') - await svg1.getAttribute('y1'))).toBeCloseTo(1000, 1);

    const svg3 = await app.client.$('#svg_3');
    expect(await svg3.getAttribute('y1')).toEqual(await svg1.getAttribute('y1'));
    expect((await svg3.getAttribute('x1') - await svg1.getAttribute('x1'))).toBeCloseTo(1000, 1);

    const svg4 = await app.client.$('#svg_4');
    expect((await svg4.getAttribute('x1') - await svg1.getAttribute('x1'))).toBeCloseTo(1000, 1);
    expect((await svg4.getAttribute('y1') - await svg1.getAttribute('y1'))).toBeCloseTo(1000, 1);
  });

  test('Check Array Multi Select', async function () {
    const { app } = require('../../../test');
    const elli = await app.client.$('#left-Ellipse');
    await elli.click();
    await mouseAction([
      { type: 'pointerMove', x: 250, y: 250, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 300, y: 300, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);

    const line = await app.client.$('#left-Line');
    await line.click();
    await mouseAction([
      { type: 'pointerMove', x: 250, y: 150, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 250, y: 350, duration: 1000, },
      { type: 'pointerUp', button: 0, },

    ]);
    await selectAll();
    await arrayAction();
    await checkSvg(1, 2, 4, 5, 7, 8, 10, 11);

    const svg1 = await app.client.$('#svg_1');//eill
    const svg2 = await app.client.$('#svg_2');//line

    const svg4 = await app.client.$('#svg_4');
    expect(await svg4.getAttribute('cx')).toEqual(await svg1.getAttribute('cx'));
    expect((await svg4.getAttribute('cy') - await svg1.getAttribute('cy'))).toEqual(1000);

    const svg5 = await app.client.$('#svg_5');
    expect(await svg5.getAttribute('x1')).toEqual(await svg2.getAttribute('x1'));
    expect((await svg5.getAttribute('y1') - await svg2.getAttribute('y1'))).toEqual(1000);

    const svg7 = await app.client.$('#svg_7');
    expect(await svg7.getAttribute('cy')).toEqual(await svg1.getAttribute('cy'));
    expect((await svg7.getAttribute('cx') - await svg1.getAttribute('cx'))).toEqual(1000);

    const svg8 = await app.client.$('#svg_8');
    expect(await svg8.getAttribute('y1')).toEqual(await svg2.getAttribute('y1'));
    expect((await svg8.getAttribute('x1') - await svg2.getAttribute('x1'))).toEqual(1000);

    const svg10 = await app.client.$('#svg_10');
    expect((await svg10.getAttribute('cx') - await svg1.getAttribute('cx'))).toEqual(1000);
    expect((await svg10.getAttribute('cy') - await svg1.getAttribute('cy'))).toEqual(1000);

    const svg11 = await app.client.$('#svg_11');
    expect((await svg11.getAttribute('y1') - await svg2.getAttribute('y1'))).toEqual(1000);
    expect((await svg11.getAttribute('x1') - await svg2.getAttribute('x1'))).toEqual(1000);
  });

  test('Check Array Group', async function () {
    const { app } = require('../../../test');
    const rect = await app.client.$('#left-Rectangle');
    await rect.click();
    await mouseAction([
      { type: 'pointerMove', x: 300, y: 300, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);

    const text = await app.client.$('#left-Text');
    await text.click();
    await mouseAction([
      { type: 'pointerMove', x: 315, y: 350, duration: 1000, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerUp', button: 0, },
    ]);
    await app.client.keys(["TEST", "NULL"]);

    await selectAll();
    const group = await app.client.$('#group');
    await group.click();
    await arrayAction();
    await checkSvg(1, 2, 6, 7, 10, 11, 14, 15);

    const svg1 = await app.client.$('#svg_1');//rect
    const svg2 = await app.client.$('#svg_2');//text

    const svg6 = await app.client.$('#svg_6');
    expect(await svg6.getAttribute('x') - await svg1.getAttribute('x')).toBeCloseTo(0, 0.1);
    expect((await svg6.getAttribute('y') - await svg1.getAttribute('y'))).toBeCloseTo(1000, 1);

    const svg7 = await app.client.$('#svg_7');
    expect(await svg7.getAttribute('x') - await svg2.getAttribute('x')).toBeCloseTo(0, 0.1);
    expect((await svg7.getAttribute('y') - await svg2.getAttribute('y'))).toBeCloseTo(1000, 1);

    const svg10 = await app.client.$('#svg_10');
    expect((await svg10.getAttribute('x') - await svg1.getAttribute('x'))).toBeCloseTo(1000, 1);
    expect((await svg10.getAttribute('y') - await svg1.getAttribute('y'))).toBeCloseTo(0, 0.1);

    const svg11 = await app.client.$('#svg_11');
    expect(await svg11.getAttribute('x') - await svg2.getAttribute('x')).toBeCloseTo(1000, 1);
    expect((await svg11.getAttribute('y') - await svg2.getAttribute('y'))).toBeCloseTo(0, 0.1);

    const svg14 = await app.client.$('#svg_14');
    expect(await svg14.getAttribute('x') - await svg1.getAttribute('x')).toBeCloseTo(1000, 1);
    expect((await svg14.getAttribute('y') - await svg1.getAttribute('y'))).toBeCloseTo(1000, 1);

    const svg15 = await app.client.$('#svg_15');
    expect((await svg15.getAttribute('x') - await svg2.getAttribute('x'))).toBeCloseTo(1000, 1);
    expect((await svg15.getAttribute('y') - await svg2.getAttribute('y'))).toBeCloseTo(1000, 1);
  });

  async function selectAll() {
    const { app } = require('../../../test');
    const select = await app.client.$('#left-Cursor');
    await select.click();
    await mouseAction([
      { type: 'pointerMove', x: 100, y: 100, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 600, y: 600, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
  };

  async function arrayAction() {
    const { app } = require('../../../test');
    const array = await app.client.$('button#array');
    await array.click();

    const arrayColumns = await app.client.$('input#columns');
    await arrayColumns.doubleClick();
    await app.client.keys(['Backspace', '2', "NULL"]);
    expect(await arrayColumns.getAttribute('value')).toEqual("2");

    const arrayRows = await app.client.$('input#rows');
    await arrayRows.doubleClick();
    await app.client.keys(['Backspace', '2', "NULL"]);
    expect(await arrayRows.getAttribute('value')).toEqual("2");

    const arrayWidth = await app.client.$('input#array_width');
    await arrayWidth.doubleClick();
    await app.client.keys(['Backspace', '100', "NULL"]);
    expect(await arrayWidth.getAttribute('value')).toEqual("100");

    const arrayHeight = await app.client.$('input#array_height');
    await arrayHeight.doubleClick();
    await app.client.keys(['Backspace', '100', "NULL"]);
    expect(await arrayHeight.getAttribute('value')).toEqual("100");

    const next = await app.client.$('button.btn.btn-default.primary');
    await next.click();
  };

  async function checkSvg(number1, number2, number3, number4, number5, number6, number7, number8) {
    number5 = number5 || 1;
    number6 = number6 || 1;
    number7 = number7 || 1;
    number8 = number8 || 1;
    await checkExist(`#svg_${number1}`);
    await checkExist(`#svg_${number2}`);
    await checkExist(`#svg_${number3}`);
    await checkExist(`#svg_${number4}`);
    await checkExist(`#svg_${number5}`);
    await checkExist(`#svg_${number6}`);
    await checkExist(`#svg_${number7}`);
    await checkExist(`#svg_${number8}`);
  };
});
