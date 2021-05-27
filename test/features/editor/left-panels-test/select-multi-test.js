const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');

test('Multi-Select', async function() {
    const { app } = require('../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas',15000);

    const rect = await app.client.$('#left-Rectangle');
    await rect.click();

    await mouseAction([
        { type: 'pointerMove', x: 200, y: 200, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 300, y: 300, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    

    const elli = await app.client.$('#left-Ellipse');
    await elli.click();

    await mouseAction([
        { type: 'pointerMove', x: 400, y: 400, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 450, y: 450, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    await mouseAction([
        { type: 'pointerMove', x: 150, y: 150, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 500, y: 500, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await new Promise((r) => setTimeout(r, 1000));

    const result = await app.client.execute(() =>{
        let g = svgCanvas.getTempGroup();
        let childNodes = Array.from(g.childNodes);
        
        const rectangle = document.getElementById('svg_1');
        const ellipse = document.getElementById('svg_2');
        const isRectInsideGroup =  childNodes.includes(rectangle);
        const isEllipseInsideGroup =  childNodes.includes(ellipse);
        return {isRectInsideGroup, isEllipseInsideGroup};
        
    });
    expect(result.isRectInsideGroup).toBe(true);
    expect(result.isEllipseInsideGroup).toBe(true);
});