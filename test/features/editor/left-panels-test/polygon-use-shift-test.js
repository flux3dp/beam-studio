const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction, touchAction } = require('../../../util/actions');

test('Draw Polygon With Shift ', async function() {
    const { app } = require('../../../test');

    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas',15000);
    
    // const elem = await app.client.$('#left-Polygon');
    // await elem.click();

    const text = await app.client.$('#left-Text');
    await text.click();

    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 10, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
    ]);


    await keyAction([

        { type: 'keyDown', value:'T' },
        { type: 'keyDown', value:'E' },
        { type: 'keyDown', value:'S' },
        { type: 'keyDown', value:'T' },
        { type: 'keyDown', value:'13' },
        { type: 'keyDown', value:'O' },
        { type: 'keyDown', value:'k' },


    ]);
    // await elem.click({ modifiers: { shift: true });

    // await app.client.keys(['Shift', "NULL"]);

    // await keyAction([

    //     { type: 'keyDown', value:'Ctrl' },
    //     { type: 'keyDown', value:'s' },
    // ]);

    await new Promise((r) => setTimeout(r, 15000));

    // await mouseAction([
    //     { type: 'pointerMove', x: 500, y: 500, duration: 100, },
    //     { type: 'pointerDown', button: 0, },
    //     { type: 'pointerMove', x: 600, y: 600, duration: 1000, },
    //     { type: 'pointerUp', button: 0, },
    // ]);

    // const svg_1 = await app.client.$('#svg_1');

    // await svg_1.touchAction([

        
    //     'press',
    //     { action: 'moveTo', x: 300, y: 300 },
    //     'release'
    // ])

    // await app.client.keys(['Shift', "NULL"]);
    

    // await checkExist('#svg_1');



    // const startPoint = await pageCoordtoCanvasCoord({x: 500, y: 500});
    // const endPoint = await pageCoordtoCanvasCoord({x: 600, y: 600});
    // let expectedX = startPoint.x;
    // let expectedY = startPoint.y;

    // const svg_1cx = await app.client.$('#svg_1');
    // const actualX = await svg_1cx.getAttribute('cx');

    // const svg_1cy = await app.client.$('#svg_1');
    // const actualY = await svg_1cy.getAttribute('cy');

    // const svg_1points = await app.client.$('#svg_1');
    // const actualP = await svg_1points.getAttribute('points');
    
    // expect(Math.abs(expectedX - actualX)).toBeLessThanOrEqual(0);
    // expect(Math.abs(expectedY - actualY)).toBeLessThanOrEqual(0);
    // expect(actualP).toEqual("1682.6908448121403,1971.1510993801146 1035.6727165627753,2073.6287035027194 738.271126089934,1489.9452176867806 1201.484963118806,1026.7313806579082 1785.168448934745,1324.1329711307494 1682.6908448121403,1971.1510993801144");
    // const svg_1angle = await app.client.$('#svg_1');
    // const actualAngle = await svg_1angle.getAttribute('angle_offset');
    // expect(actualAngle).toEqual("0.9424777960769379");
    
    

});