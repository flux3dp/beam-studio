const { checkExist } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Create Text ', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() => {
        location.reload();
    });
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
    await new Promise((r) => setTimeout(r, 1000));
    /*text style set */
    const optionstyle = await app.client.$('option[value="Bold"]');
    await optionstyle.click();
    const svg_1style = await app.client.$('#svg_1');
    const styletext = await svg_1style.getAttribute('font-postscript');
    expect(styletext).toEqual('MicrosoftJhengHeiBold');
    await new Promise((r) => setTimeout(r, 1000));
    
});


test('Check Text Font Family', async function() {
    const { app } = require('../../../test');
    /*text font set */
    const optionfont = await app.client.$('option[value="標楷體"]');
    await optionfont.click();
    const svg_1font= await app.client.$('#svg_1');
    const fonttext = await svg_1font.getAttribute('font-family');
    expect(fonttext).toEqual('標楷體');
    await new Promise((r) => setTimeout(r, 1000));
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
    await new Promise((r) => setTimeout(r, 1000));
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
    await new Promise((r) => setTimeout(r, 1000));
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
    await new Promise((r) => setTimeout(r, 1000));
});

test('Check Text Vertical', async function() {
    const { app } = require('../../../test');
    /* text Vertical text */
    const Vertical = await app.client.$('div#vertical_text.onoffswitch');
    await Vertical.click();
    const svg_1verti = await app.client.$('#svg_1' );
    const verticaltext = await svg_1verti.getAttribute('data-verti');
    expect(verticaltext).toEqual('true');
    await new Promise((r) => setTimeout(r, 1000));

});

test('Check Text Infill', async function() {
    const { app } = require('../../../test');
    /* text Infill text */
    const Infill = await app.client.$('div#infill.onoffswitch');
    await Infill.click();
    const svg_1opacity = await app.client.$('#svg_1' );
    const Infilltext =await svg_1opacity.getAttribute('fill-opacity');
    expect(Infilltext).toEqual('1');
    await new Promise((r) => setTimeout(r, 1000));
});


test('Check Text Convert To Path', async function() {
    const { app } = require('../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
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

    await checkExist('#svg_2', 2000);
    const svg_2d = await app.client.$('#svg_2');
    const textd = await svg_2d.getAttribute('d');
    // console.log(text);
    
    expect(textd).toEqual("M561.308594,714.261719 L539.484375,714.261719 L539.484375,782.277344 L531.136719,782.277344 L531.136719,714.261719 L509.355469,714.261719 L509.355469,706.644531 L561.308594,706.644531 zM613.070313,782.277344 L573.320313,782.277344 L573.320313,706.644531 L611.359375,706.644531 L611.359375,714.261719 L581.625,714.261719 L581.625,739.992188 L609.113281,739.992188 L609.113281,747.609375 L581.625,747.609375 L581.625,774.660156 L613.070313,774.660156 zM624.246094,769.191406 C626.363281,771.117188 629.414063,772.71875 633.402344,774.003906 C637.390625,775.289063 641.078125,775.933594 644.464844,775.929688 C655.460938,775.933594 660.960938,771.929688 660.964844,763.917969 C660.960938,761.675781 660.390625,759.671875 659.257813,757.914063 C658.117188,756.15625 656.582031,754.636719 654.644531,753.347656 C652.707031,752.066406 648.886719,749.957031 643.191406,747.023438 C634.984375,742.824219 629.792969,739.160156 627.617188,736.035156 C625.433594,732.910156 624.34375,729.378906 624.347656,725.441406 C624.34375,719.355469 626.820313,714.488281 631.769531,710.839844 C636.714844,707.195313 642.929688,705.375 650.417969,705.371094 C657.96875,705.375 663.324219,706.269531 666.484375,708.058594 L666.484375,717.675781 C662.054688,714.621094 656.34375,713.089844 649.347656,713.089844 C644.558594,713.089844 640.648438,714.109375 637.625,716.140625 C634.59375,718.179688 633.082031,721.035156 633.085938,724.707031 C633.082031,726.992188 633.609375,728.96875 634.671875,730.644531 C635.726563,732.320313 637.167969,733.777344 638.996094,735.011719 C640.816406,736.25 644.363281,738.1875 649.636719,740.824219 C657.054688,744.503906 662.25,748.09375 665.214844,751.589844 C668.175781,755.09375 669.65625,759.007813 669.660156,763.332031 C669.65625,769.78125 667.3125,774.761719 662.628906,778.273438 C657.9375,781.789063 651.378906,783.542969 642.949219,783.546875 C640.375,783.542969 637.027344,783.121094 632.914063,782.277344 C628.792969,781.433594 625.90625,780.410156 624.246094,779.199219 zM729.082031,714.261719 L707.257813,714.261719 L707.257813,782.277344 L698.910156,782.277344 L698.910156,714.261719 L677.128906,714.261719 L677.128906,706.644531 L729.082031,706.644531 zM731.085938,782.277344 ");

});