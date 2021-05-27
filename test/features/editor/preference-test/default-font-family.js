const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');
const { dialog } = require('electron');

test('Check Preference Font Family', async function() {
    const { app } = require('../../../test');
    
    await checkExist('#svgcanvas',15000);

    await app.client.execute(() => {

        location.hash = '#studio/settings';

    });

    const fontfamily = await app.client.$('select#qa-set-font-family option[value="Times New Roman"]');
    await fontfamily.click();

    const fontfamilycheck= await app.client.$('select#qa-set-font-family');
    const fontfamilycheck2 = await fontfamilycheck.getAttribute('value');
    expect(fontfamilycheck2).toEqual('Times New Roman');

    const done = await app.client.$('a.btn.btn-done');
    await done.click();

    await checkExist('#svgcanvas',15000);

    const text = await app.client.$('#left-Text');
    await text.click();
  
    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 10, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
    ]);
    
    await app.client.keys(['T', 'E', 'S', 'T', 'Space','F', 'O', 'N', 'T', 'F', 'Space', 'F', 'A', 'M', 'I', 'L', 'Y', "NULL"]);
    const svg_1font= await app.client.$('#svg_1');
    const fonttext = await svg_1font.getAttribute('font-family');
    expect(fonttext).toEqual('Times New Roman');


});