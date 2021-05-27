const { pause, checkExist, checkVisible, updateInput } = require('../../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../../util/actions');

test('Change Speed', async function() {
    const { app } = require('../../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas',15000);

    const rect = await app.client.$('#left-Rectangle');
    await rect.click();

    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 500, y: 500, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const layerbutton = await app.client.$('div.tab.layers');
    await layerbutton.click(); 

    const speed = await app.client.$('div#speed.panel input');
    await speed.doubleClick();
    await app.client.keys(['Backspace', '1', '2', '0', 'Enter',"NULL"]);

    const input = await app.client.$('div#speed.panel input' );
    const strengthvalue =await input.getAttribute('value');
    expect(strengthvalue).toEqual('120');
    
    const gobutton = await app.client.$('div.go-button-container');
    await gobutton.click(); 

    await new Promise((r) => setTimeout(r, 1000));
    await checkExist('div.modal-alert.animate__animated.animate__bounceIn',1500);

    const next = await app.client.$('button.btn.btn-default.primary');
    await next.click();    

});