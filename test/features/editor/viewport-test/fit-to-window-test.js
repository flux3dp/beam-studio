const { checkExist, setReload} = require('../../../util/utils');

test('Check Fit To Window', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);

    const zoomIn = await app.client.$('div.zoom-btn.zoom-in');
    await zoomIn.click();
    await new Promise((r) => setTimeout(r, 1000));

    const zoomIn2 = await app.client.$('div.zoom-btn.zoom-in');
    await zoomIn2.click();
    await new Promise((r) => setTimeout(r, 1000));

    const zoomIn3 = await app.client.$('div.zoom-btn.zoom-in');
    await zoomIn3.click();
    await new Promise((r) => setTimeout(r, 1000));

    const number = await app.client.$('div.zoom-ratio');
    await number.click({button: 2});

    const fittoWindow = await app.client.$('div#fit_to_window');
    await fittoWindow.click();

    await new Promise((r) => setTimeout(r, 1000));

    
    if(process.platform === 'darwin'){
        const zoominCanvas = await app.client.$('div#svgcanvas');
        await zoominCanvas.getAttribute('style');
        expect(await zoominCanvas.getAttribute('style')).toEqual('position: relative; width: 2422.5px; height: 1695.75px;');
        const zoomRatio = await app.client.$('div.zoom-ratio');
        await zoomRatio.getText();
        expect(await zoomRatio.getText()).toEqual('71%');
    } 
    else{
        const zoominCanvas = await app.client.$('div#svgcanvas');
        await zoominCanvas.getAttribute('style');
        expect(await zoominCanvas.getAttribute('style')).toEqual('position: relative; width: 2304.43px; height: 1613.1px;');
        const zoomRatio = await app.client.$('div.zoom-ratio');
        await zoomRatio.getText();
        expect(await zoomRatio.getText()).toEqual('56%');
    }
});

test('Check Fit To Window Then Change Canvas', async function() {
    const { app } = require('../../../test');
    if(process.platform === 'darwin'){
        const zoomIn = await app.client.$('div.zoom-btn.zoom-in');
        await zoomIn.click();
        const zoominCanvas = await app.client.$('div#svgcanvas');
        await zoominCanvas.getAttribute('style');
        expect(await zoominCanvas.getAttribute('style')).toEqual('position: relative; width: 2721.26px; height: 1904.88px;');
        const zoomRatio = await app.client.$('div.zoom-ratio');
        await zoomRatio.getText();
        expect(await zoomRatio.getText()).toEqual('80%');
    } 
    else{
        const zoomIn = await app.client.$('div.zoom-btn.zoom-in');
        await zoomIn.click();
        const zoominCanvas = await app.client.$('div#svgcanvas');
        await zoominCanvas.getAttribute('style');
        expect(await zoominCanvas.getAttribute('style')).toEqual('position: relative; width: 2447.55px; height: 1713.29px;');
        const zoomRatio = await app.client.$('div.zoom-ratio');
        await zoomRatio.getText();
        expect(await zoomRatio.getText()).toEqual('60%');
    }
    
    if(process.platform === 'darwin'){
        const zoomOut = await app.client.$('div.zoom-btn.zoom-out');
        await zoomOut.click();
        const zoomoutCanvas2 = await app.client.$('div#svgcanvas');
        await zoomoutCanvas2.getAttribute('style');
        expect(await zoomoutCanvas2.getAttribute('style')).toEqual('position: relative; width: 2381.1px; height: 1666.77px;');
        const zoomRatio2 = await app.client.$('div.zoom-ratio');
        await zoomRatio2.getText();
        expect(await zoomRatio2.getText()).toEqual('70%');
    } 
    else{
        const zoomOut = await app.client.$('div.zoom-btn.zoom-out');
        await zoomOut.click();
        const zoomoutCanvas2 = await app.client.$('div#svgcanvas');
        await zoomoutCanvas2.getAttribute('style');
        expect(await zoomoutCanvas2.getAttribute('style')).toEqual('position: relative; width: 2039.63px; height: 1427.74px;');
        const zoomRatio2 = await app.client.$('div.zoom-ratio');
        await zoomRatio2.getText();
        expect(await zoomRatio2.getText()).toEqual('50%');
    }
});
