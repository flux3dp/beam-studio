const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');

test('Text Test', async function() {
    const { app } = require('../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas',10000);

    const text = await app.client.$('#left-Text');
    await text.click();
  
    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 10, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
    ]);
    
    await app.client.keys(['T', 'E', 'S', 'T', "NULL"]);

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
    
    await app.client.keys(['Shift', 'Enter', "NULL"]);
    await app.client.keys(['T', 'E', 'X', 'T', "NULL"]);
    await new Promise((r) => setTimeout(r, 1000));

    /*text style set */
    const optionstyle = await app.client.$('option[value="Bold"]');
    await optionstyle.click();
    
    const svg_1style = await app.client.$('#svg_1');
    const styletext = await svg_1style.getAttribute('font-postscript');
    expect(styletext).toEqual('MicrosoftJhengHeiBold');
    await new Promise((r) => setTimeout(r, 1000));
    
    /*text font set */
    const optionfont = await app.client.$('option[value="細明體-ExtB"]');
    await optionfont.click();

    const svg_1font= await app.client.$('#svg_1');
    const fonttext = await svg_1font.getAttribute('font-family');
    expect(fonttext).toEqual('細明體-ExtB');
    await new Promise((r) => setTimeout(r, 1000));

    /* text size set */
    const size = await app.client.$('div#qa-font-size-input.option-block input');
    await size.click();

    await app.client.keys(['Backspace', 'Backspace', 'Backspace', '5', '0', 'Enter', "NULL"]);

    const svg_1size = await app.client.$('#svg_1' );
    const sizetext = await svg_1size.getAttribute('font-size');
    expect(sizetext).toEqual('50');
    await new Promise((r) => setTimeout(r, 1000));
    
    /* text letter spacing */
    const letter = await app.client.$('div#qa-letter-spacing-input input');
    await letter.click();

    await app.client.keys(['Backspace', '1', '.', '5', 'Enter',"NULL"]);

    const svg_1letter = await app.client.$('#svg_1' );
    const letterspacingtext = await svg_1letter.getAttribute('letter-spacing');
    expect(letterspacingtext).toEqual('1.5em');
    await new Promise((r) => setTimeout(r, 1000));
    
    /* text line spacing */
    const line = await app.client.$('div#qa-line-spacing-input input');
    await line.click();

    await app.client.keys(['Backspace', '2', 'Enter',"NULL"]);

    const svg_1line = await app.client.$('#svg_1' );
    const linespacingtext =await svg_1line.getAttribute('data-line-spacing');
    expect(linespacingtext).toEqual('2');
    await new Promise((r) => setTimeout(r, 1000));

    /* text Vertical text */
    const Vertical = await app.client.$('div#qa-VerticalTextSwitch .onoffswitch');
    await Vertical.click();

    const svg_1verti = await app.client.$('#svg_1' );
    const verticaltext = await svg_1verti.getAttribute('data-verti');
    expect(verticaltext).toEqual('true');
    await new Promise((r) => setTimeout(r, 1000));

    /* text Infill text */
    const Infill = await app.client.$('div#qa-InfillTextSwitch .onoffswitch');
    await Infill.click();

    const svg_1opacity = await app.client.$('#svg_1' );
    const Infilltext =await svg_1opacity.getAttribute('fill-opacity');
    expect(Infilltext).toEqual('1');
    await new Promise((r) => setTimeout(r, 1000));

});