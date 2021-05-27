const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');

test('Draw Ellipse', async function() {

    const { app }= require('../../../test');
    //const app = await restartAndSetStorage();//要重啟顯示這行，不重啟顯示上行，沒辦法同時開啟，因為app共用
    //await checkExist('#svgcanvas', 15000);

    await app.client.execute(() => {
        location.reload()
    });
    await checkExist('#svgcanvas',15000);

    const elli = await app.client.$('#left-Ellipse');
    await elli.click();

    await mouseAction([
        { type: 'pointerMove', x: 400, y: 400, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 464, y: 464, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');

    const startPoint = await pageCoordtoCanvasCoord({x: 400, y: 400});
    const endPoint = await pageCoordtoCanvasCoord({x: 464, y: 464});
    let expectedX = startPoint.x;
    let expectedY = startPoint.y;
    let expectedW = Math.pow(endPoint.x - startPoint.x, 2) ;
    let expectedH = Math.pow(endPoint.y - startPoint.y, 2) ;
    let expectedR = Math.sqrt(expectedW + expectedH)/Math.sqrt(2);
    //console.log(expectedR);
    const svg_1cx = await app.client.$('#svg_1');
    const actualCX = await svg_1cx.getAttribute('cx');

    const svg_1cy = await app.client.$('#svg_1');
    const actualCY = await svg_1cy.getAttribute('cy');

    const svg_1rx = await app.client.$('#svg_1');
    const actualR = await svg_1rx.getAttribute('rx');
    
    const aCX = parseFloat(actualCX).toFixed(10);
    const aCY = parseFloat(actualCY).toFixed(10);
    const aR = parseFloat(actualR).toFixed(10);
    expect(Math.abs(expectedX - aCX)).toBeLessThanOrEqual(1e-10);
    expect(Math.abs(expectedY - aCY)).toBeLessThanOrEqual(1e-10);
    expect(Math.abs(expectedR - aR)).toBeLessThanOrEqual(1e-10);




});