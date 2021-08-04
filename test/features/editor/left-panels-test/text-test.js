const { checkExist, setReload } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Create Text ', async function() {
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

    await app.client.keys(['T', 'E', 'S', 'T', "NULL"]);
    const gettext = await app.client.$('#svg_1');
    expect(await gettext.getText()).toEqual('TEST');
});

test('Check Text Font Family', async function() {
    const { app } = require('../../../test');
    /*text font set */
    if(process.platform === 'darwin'){
        const reactSelectControl = await app.client.$('.react-select__control');
        await reactSelectControl.click();
        await app.client.keys(['Arial',"Enter", "NULL"]);
        const svg_1font= await app.client.$('#svg_1');
        const fonttext = await svg_1font.getAttribute('font-family');
        expect(fonttext).toEqual('Arial-BoldItalicMT');
        await new Promise((r) => setTimeout(r, 1000));
    } else{
        const optionfont = await app.client.$('option[value="Arial"]');
        await optionfont.click();
        const svg_1font= await app.client.$('#svg_1');
        const fonttext = await svg_1font.getAttribute('font-family');
        expect(fonttext).toEqual('Arial');
    }
});

test('Check Text Font Style',async function(){
    const { app } = require('../../../test');
    const cursor = await app.client.$('#left-Cursor');
    await cursor.click();

    await mouseAction([
    { type: 'pointerMove', x: 305, y: 305, duration: 10, },
    { type: 'pointerDown', button: 0, },
    { type: 'pointerUp', button: 0, },
    { type: 'pointerMove', x: 305, y: 305, duration: 10, },
    { type: 'pointerDown', button: 0, },
    { type: 'pointerUp', button: 0, },
    ]);

    await app.client.keys(['Shift', 'Enter','TEXT', "NULL"]);
    /*text style set */
    const optionstyle = await app.client.$('option[value="Bold"]');
    await optionstyle.click();
    const svg_1style = await app.client.$('#svg_1');
    const styletext = await svg_1style.getAttribute('font-postscript');
    expect(styletext).toEqual('Arial-BoldMT');
});

test('Check Text Font Size', async function() {
    const { app } = require('../../../test');
    /* text size set */
    const size = await app.client.$('input#font_size');
    await size.doubleClick();
    await app.client.keys(['Backspace', 'Backspace', 'Backspace', '1', '5', '0', 'Enter', "NULL"]);
    const svg_1size = await app.client.$('#svg_1' );
    const sizetext = await svg_1size.getAttribute('font-size');
    expect(sizetext).toEqual('150');
});

test('Check Text Font Letter Spacing', async function() {
    const { app } = require('../../../test');
    /* text letter spacing */
    const letter = await app.client.$('input#letter_spacing');
    await letter.doubleClick();
    await app.client.keys(['Backspace', '1', '.', '5', 'Enter',"NULL"]);
    const svg_1letter = await app.client.$('#svg_1' );
    const letterspacingtext = await svg_1letter.getAttribute('letter-spacing');
    expect(letterspacingtext).toEqual('1.5em');
});

test('Check Text Line Spacing', async function() {
    const { app } = require('../../../test');
    /* text line spacing */
    const line = await app.client.$('input#line_spacing');
    await line.doubleClick();
    await app.client.keys(['Backspace', '2', 'Enter',"NULL"]);
    const svg_1line = await app.client.$('#svg_1' );
    const linespacingtext =await svg_1line.getAttribute('data-line-spacing');
    expect(linespacingtext).toEqual('2');
});

test('Check Text Vertical', async function() {
    const { app } = require('../../../test');
    /* text Vertical text */
    const Vertical = await app.client.$('div#vertical_text.onoffswitch');
    await Vertical.click();
    const svg_1verti = await app.client.$('#svg_1' );
    const verticaltext = await svg_1verti.getAttribute('data-verti');
    expect(verticaltext).toEqual('true');
});

test('Check Text Infill', async function() {
    const { app } = require('../../../test');
    /* text Infill text */
    const Infill = await app.client.$('div#infill.onoffswitch');
    await Infill.click();
    const svg_1opacity = await app.client.$('#svg_1' );
    const Infilltext =await svg_1opacity.getAttribute('fill-opacity');
    expect(Infilltext).toEqual('1');
});

test('Check Text Convert To Path', async function() {
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
    await app.client.keys(['T', 'E', 'S', 'T', "NULL"]);

    const button = await app.client.$('button.btn.btn-default');
    await button.click();
    await checkExist('#svg_2', 5000);

    const path = await app.client.$('#svg_2');
    if(process.platform === 'darwin'){
        await path.click();
        await path.click();
    } 
    else{
        await path.doubleClick();
    }
    
    await checkExist('#pathpointgrip_45', 5000);
});
