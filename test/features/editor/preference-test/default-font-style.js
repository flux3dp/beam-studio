const { checkExist, setAppPage } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Preference Font Style', async function() {
    const { app } = require('../../../test');
    await setAppPage('#studio/settings');
    
    const fontfamily = await app.client.$('select#set-default-font-family option[value="Times New Roman"]');
    await fontfamily.click();

    const fontstyle = await app.client.$('select#set-default-font-style option[value="TimesNewRomanPS-ItalicMT"]');
    await fontstyle.click();

    const fontfamilycheck= await app.client.$('select#set-default-font-family');
    const fontfamilycheck2 = await fontfamilycheck.getAttribute('value');
    expect(fontfamilycheck2).toEqual('Times New Roman');

    const fontstylecheck= await app.client.$('select#set-default-font-style');
    const fontstylecheck2 = await fontstylecheck.getAttribute('value');
    expect(fontstylecheck2).toEqual('TimesNewRomanPS-ItalicMT');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();

    await checkExist('#svgcanvas',15000);

    const text = await app.client.$('#left-Text');
    await text.click();
  
    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 10, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
    ]);
    
    await app.client.keys(['T', 'E', 'S', 'T', 'Shift', 'Enter', 'F', 'O', 'N', 'T', 'F', 'Space', 'S', 'T', 'Y', 'L', 'E', "NULL"]);
    const svg_1font= await app.client.$('#svg_1');
    const fonttext = await svg_1font.getAttribute('font-postscript');
    expect(fonttext).toEqual('TimesNewRomanPS-ItalicMT');
});
