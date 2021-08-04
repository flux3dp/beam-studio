const { checkExist, setReload } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Array Text', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas',15000);

    const text = await app.client.$('#left-Text');
    await text.click();
    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 10, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
    ]);
    await app.client.keys(['ARRAY', 'Space', 'TEST']);
    await checkExist('#svg_1');

    const array = await app.client.$('button#array');
    await array.click();

    const array_columns = await app.client.$('input#columns');
    await array_columns.doubleClick();
    await app.client.keys(['Backspace', '2', "NULL"]);
    expect(await array_columns.getAttribute('value')).toEqual("2");

    const array_rows = await app.client.$('input#rows');
    await array_rows.doubleClick();
    await app.client.keys(['Backspace', '2', "NULL"]);
    expect(await array_rows.getAttribute('value')).toEqual("2");

    const array_width = await app.client.$('input#array_width');
    await array_width.doubleClick();
    await app.client.keys(['Backspace', '100', "NULL"]);
    expect(await array_width.getAttribute('value')).toEqual("100");

    const array_height = await app.client.$('input#array_height');
    await array_height.doubleClick();
    await app.client.keys(['Backspace', '100', "NULL"]);
    expect(await array_height.getAttribute('value')).toEqual("100");


    const next = await app.client.$('button.btn.btn-default.primary');
    await next.click();

    // await new Promise((r) => setTimeout(r, 150000));
    await checkExist('#svg_1');
    await checkExist('#svg_2');
    await checkExist('#svg_4');
    await checkExist('#svg_6');

    const svg_1_text = await app.client.$('#svg_1');
    await svg_1_text.getText();
    // console.log(await svg_1_text.getAttribute('x'));
    // console.log(await svg_1_text.getAttribute('y'));

    const svg_2_text = await app.client.$('#svg_2');
    await svg_2_text.getText();
    expect(await svg_2_text.getText()).toEqual(await svg_1_text.getText());
    expect(await svg_2_text.getAttribute('x')).toEqual(await svg_1_text.getAttribute('x'));
    expect(Math.round((await svg_2_text.getAttribute('y')-await svg_1_text.getAttribute('y')))).toEqual(1000);


    const svg_4_text = await app.client.$('#svg_4');
    await svg_4_text.getText();
    expect(await svg_4_text.getText()).toEqual(await svg_1_text.getText());
    expect(await svg_4_text.getAttribute('y')).toEqual(await svg_1_text.getAttribute('y'));
    expect(Math.round((await svg_4_text.getAttribute('x')-await svg_1_text.getAttribute('x')))).toEqual(1000);

    const svg_6_text = await app.client.$('#svg_6');
    await svg_6_text.getText();
    expect(await svg_6_text.getText()).toEqual(await svg_1_text.getText());
    expect(Math.round((await svg_6_text.getAttribute('x')-await svg_1_text.getAttribute('x')))).toEqual(1000);
    expect(Math.round((await svg_6_text.getAttribute('y')-await svg_1_text.getAttribute('y')))).toEqual(1000);
});

test('Check Array Geometry', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas',15000);

    const polygon = await app.client.$('#left-Polygon');
    await polygon.click();

    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 350, y: 350, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');

    const array = await app.client.$('button#array');
    await array.click();
    await new Promise((r) => setTimeout(r, 1000));
    const array2 = await app.client.$('button#array');
    await array2.click();

    const array_columns = await app.client.$('input#columns');
    await array_columns.doubleClick();
    await app.client.keys(['Backspace', '2', "NULL"]);
    expect(await array_columns.getAttribute('value')).toEqual("2");

    const array_rows = await app.client.$('input#rows');
    await array_rows.doubleClick();
    await app.client.keys(['Backspace', '2', "NULL"]);
    expect(await array_rows.getAttribute('value')).toEqual("2");

    const array_width = await app.client.$('input#array_width');
    await array_width.doubleClick();
    await app.client.keys(['Backspace', '100', "NULL"]);
    expect(await array_width.getAttribute('value')).toEqual("100");

    const array_height = await app.client.$('input#array_height');
    await array_height.doubleClick();
    await app.client.keys(['Backspace', '100', "NULL"]);
    expect(await array_height.getAttribute('value')).toEqual("100");

    const next = await app.client.$('button.btn.btn-default.primary');
    await next.click();
    // await new Promise((r) => setTimeout(r, 500000));

    await checkExist('#svg_2');
    await checkExist('#svg_3');
    await checkExist('#svg_4');

    const svg_1_ploygon = await app.client.$('#svg_1');

    const svg_2_polygon = await app.client.$('#svg_2');
    expect((await svg_2_polygon.getAttribute('x')-await svg_1_ploygon.getAttribute('x'))).toEqual(0);
    expect((await svg_2_polygon.getAttribute('y')-await svg_1_ploygon.getAttribute('y'))).toEqual(0);

    const svg_3_polygon = await app.client.$('#svg_3');
    expect((await svg_3_polygon.getAttribute('x')-await svg_1_ploygon.getAttribute('x'))).toEqual(0);
    expect((await svg_3_polygon.getAttribute('y')-await svg_1_ploygon.getAttribute('y'))).toEqual(0);

    const svg_4_polygon = await app.client.$('#svg_4');
    expect((await svg_4_polygon.getAttribute('x')-await svg_1_ploygon.getAttribute('x'))).toEqual(0);
    expect((await svg_4_polygon.getAttribute('y')-await svg_1_ploygon.getAttribute('y'))).toEqual(0);
});

test('Check Array Path', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas',15000);

    const path = await app.client.$('#left-Line');
    await path.click();

    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 350, y: 350, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');

    const array = await app.client.$('button#array');
    await array.click();
    await new Promise((r) => setTimeout(r, 1000));
    const array2 = await app.client.$('button#array');
    await array2.click();

    const array_columns = await app.client.$('input#columns');
    await array_columns.doubleClick();
    await app.client.keys(['Backspace', '2', "NULL"]);
    expect(await array_columns.getAttribute('value')).toEqual("2");

    const array_rows = await app.client.$('input#rows');
    await array_rows.doubleClick();
    await app.client.keys(['Backspace', '2', "NULL"]);
    expect(await array_rows.getAttribute('value')).toEqual("2");

    const array_width = await app.client.$('input#array_width');
    await array_width.doubleClick();
    await app.client.keys(['Backspace', '100', "NULL"]);
    expect(await array_width.getAttribute('value')).toEqual("100");

    const array_height = await app.client.$('input#array_height');
    await array_height.doubleClick();
    await app.client.keys(['Backspace', '100', "NULL"]);
    expect(await array_height.getAttribute('value')).toEqual("100");

    const next = await app.client.$('button.btn.btn-default.primary');
    await next.click();
    // await new Promise((r) => setTimeout(r, 500000));

    await checkExist('#svg_2');
    await checkExist('#svg_3');
    await checkExist('#svg_4');

    const svg_1_line = await app.client.$('#svg_1');
    const actual_svg1_x1 = await svg_1_line.getAttribute('x1');
    const svg_1_x1 = parseFloat(actual_svg1_x1).toFixed(7);

    const svg_2_line = await app.client.$('#svg_2');
    const actual_svg2_x1 = await svg_2_line.getAttribute('x1');
    const svg_2_x1 = parseFloat(actual_svg2_x1).toFixed(7);
    expect(svg_2_x1).toEqual(svg_1_x1);
    expect(Math.round((await svg_2_line.getAttribute('y1') - await svg_1_line.getAttribute('y1')))).toEqual(1000);

    const svg_3_line = await app.client.$('#svg_3');
    expect(await svg_3_line.getAttribute('y1')).toEqual(await svg_1_line.getAttribute('y1'));
    expect(Math.round((await svg_3_line.getAttribute('x1')-await svg_1_line.getAttribute('x1')))).toEqual(1000);

    const svg_4_line = await app.client.$('#svg_4');
    expect(Math.round((await svg_4_line.getAttribute('x1')-await svg_1_line.getAttribute('x1')))).toEqual(1000);
    expect(Math.round((await svg_4_line.getAttribute('y1')-await svg_1_line.getAttribute('y1')))).toEqual(1000);
});

test('Check Array Multi Select', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas',15000);

    const elli = await app.client.$('#left-Ellipse');
    await elli.click();
    await mouseAction([
        { type: 'pointerMove', x: 250, y: 250, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 300, y: 300, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');

    const line = await app.client.$('#left-Line');
    await line.click(); 
    await mouseAction([
        { type: 'pointerMove', x: 250, y: 150, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 250, y: 350, duration: 1000, },
        { type: 'pointerUp', button: 0, },

    ]);
    await checkExist('#svg_2');

    const select = await app.client.$('#left-Cursor');
    await select.click(); 

    await mouseAction([
        { type: 'pointerMove', x: 100, y: 100, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },

    ]);

    const array = await app.client.$('button#array');
    await array.click();

    const array_columns = await app.client.$('input#columns');
    await array_columns.doubleClick();
    await app.client.keys(['Backspace', '2', "NULL"]);
    expect(await array_columns.getAttribute('value')).toEqual("2");

    const array_rows = await app.client.$('input#rows');
    await array_rows.doubleClick();
    await app.client.keys(['Backspace', '2', "NULL"]);
    expect(await array_rows.getAttribute('value')).toEqual("2");

    const array_width = await app.client.$('input#array_width');
    await array_width.doubleClick();
    await app.client.keys(['Backspace', '100', "NULL"]);
    expect(await array_width.getAttribute('value')).toEqual("100");

    const array_height = await app.client.$('input#array_height');
    await array_height.doubleClick();
    await app.client.keys(['Backspace', '100', "NULL"]);
    expect(await array_height.getAttribute('value')).toEqual("100");

    const next = await app.client.$('button.btn.btn-default.primary');
    await next.click();
    // await new Promise((r) => setTimeout(r, 500000));

    await checkExist('#svg_4');
    await checkExist('#svg_5');
    await checkExist('#svg_6');
    await checkExist('#svg_7');
    await checkExist('#svg_8');
    await checkExist('#svg_9');

    const svg_1_elli = await app.client.$('#svg_1');
    const svg_2_line = await app.client.$('#svg_2');

    const svg_4_elli = await app.client.$('#svg_4');
    expect(await svg_4_elli.getAttribute('cx')).toEqual(await svg_1_elli.getAttribute('cx'));
    expect(Math.round((await svg_4_elli.getAttribute('cy') - await svg_1_elli.getAttribute('cy')))).toEqual(1000);

    const svg_5_elli = await app.client.$('#svg_5');
    expect(await svg_5_elli.getAttribute('cy')).toEqual(await svg_1_elli.getAttribute('cy'));
    expect(Math.round((await svg_5_elli.getAttribute('cx') - await svg_1_elli.getAttribute('cx')))).toEqual(1000);

    const svg_6_elli = await app.client.$('#svg_6');
    expect(Math.round((await svg_6_elli.getAttribute('cy') - await svg_1_elli.getAttribute('cy')))).toEqual(1000);
    expect(Math.round((await svg_6_elli.getAttribute('cx') - await svg_1_elli.getAttribute('cx')))).toEqual(1000);

    const svg_7_line = await app.client.$('#svg_7');
    expect(await svg_7_line.getAttribute('x1')).toEqual(await svg_2_line.getAttribute('x1'));
    expect(Math.round((await svg_7_line.getAttribute('y1') - await svg_2_line.getAttribute('y1')))).toEqual(1000);

    const svg_8_line = await app.client.$('#svg_8');
    expect(await svg_8_line.getAttribute('y1')).toEqual(await svg_2_line.getAttribute('y1'));
    expect(Math.round((await svg_8_line.getAttribute('x1') - await svg_2_line.getAttribute('x1')))).toEqual(1000);

    const svg_9_line = await app.client.$('#svg_9');
    expect(Math.round((await svg_9_line.getAttribute('y1') - await svg_2_line.getAttribute('y1')))).toEqual(1000);
    expect(Math.round((await svg_9_line.getAttribute('x1') - await svg_2_line.getAttribute('x1')))).toEqual(1000);
});

test('Check Array Group', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas',15000);

    const rect = await app.client.$('#left-Rectangle');
    await rect.click();

    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');

    const text = await app.client.$('#left-Text');
    await text.click();
    await mouseAction([
        { type: 'pointerMove', x: 315, y: 350, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
    ]);

    await app.client.keys(["TEST", "NULL"]);
    await checkExist('#svg_2');
    const select = await app.client.$('#left-Cursor');
    await select.click(); 
    
    await mouseAction([
        { type: 'pointerMove', x: 200, y: 200, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    
    ]);

    const group = await app.client.$('#qa-group');
    await group.click();

    const array = await app.client.$('button#array');
    await array.click();

    const array_columns = await app.client.$('input#columns');
    await array_columns.doubleClick();
    await app.client.keys(['Backspace', '2', "NULL"]);
    expect(await array_columns.getAttribute('value')).toEqual("2");

    const array_rows = await app.client.$('input#rows');
    await array_rows.doubleClick();
    await app.client.keys(['Backspace', '2', "NULL"]);
    expect(await array_rows.getAttribute('value')).toEqual("2");

    const array_width = await app.client.$('input#array_width');
    await array_width.doubleClick();
    await app.client.keys(['Backspace', '100', "NULL"]);
    expect(await array_width.getAttribute('value')).toEqual("100");

    const array_height = await app.client.$('input#array_height');
    await array_height.doubleClick();
    await app.client.keys(['Backspace', '100', "NULL"]);
    expect(await array_height.getAttribute('value')).toEqual("100");

    const next = await app.client.$('button.btn.btn-default.primary');
    await next.click();
    // await new Promise((r) => setTimeout(r, 500000));
    await checkExist('g#svg_4');
    await checkExist('g#svg_5');
    await checkExist('g#svg_9');
    await checkExist('g#svg_13');
    const svg_1_rect = await app.client.$('#svg_1');
    const actual_svg1_x1 = await svg_1_rect.getAttribute('x');
    const svg_1_x1 = parseFloat(actual_svg1_x1).toFixed(7);

    const svg_2_text = await app.client.$('#svg_2');

    const svg_6_rect = await app.client.$('#svg_6');
    expect(await svg_6_rect.getAttribute('x')).toEqual(svg_1_x1);
    expect(Math.round((await svg_6_rect.getAttribute('y')-await svg_1_rect.getAttribute('y')))).toEqual(1000);

    const svg_10_rect = await app.client.$('#svg_10');
    expect(await svg_10_rect.getAttribute('y')).toEqual(await svg_1_rect.getAttribute('y'));
    expect(Math.round((await svg_10_rect.getAttribute('x')-await svg_1_rect.getAttribute('x')))).toEqual(1000);

    const svg_14_rect = await app.client.$('#svg_14');
    expect(Math.round((await svg_14_rect.getAttribute('x')-await svg_1_rect.getAttribute('x')))).toEqual(1000);
    expect(Math.round((await svg_14_rect.getAttribute('y')-await svg_1_rect.getAttribute('y')))).toEqual(1000);

    const svg_7_rect = await app.client.$('#svg_7');
    expect(await svg_7_rect.getAttribute('x')).toEqual(await svg_2_text.getAttribute('x'));
    expect(Math.round((await svg_7_rect.getAttribute('y')-await svg_2_text.getAttribute('y')))).toEqual(1000);

    const svg_11_text = await app.client.$('#svg_11');
    expect(await svg_11_text.getAttribute('y')).toEqual(await svg_2_text.getAttribute('y'));
    expect(Math.round((await svg_11_text.getAttribute('x')-await svg_2_text.getAttribute('x')))).toEqual(1000);

    const svg_15_text = await app.client.$('#svg_15');
    expect(Math.round((await svg_15_text.getAttribute('x')-await svg_2_text.getAttribute('x')))).toEqual(1000);
    expect(Math.round((await svg_15_text.getAttribute('y')-await svg_2_text.getAttribute('y')))).toEqual(1000);
});
