const { checkExist, setReload} = require('../../../util/utils');

test('Check Percent of Canvas ', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);

    const result = await app.client.execute(() => {
        const zoomValue = svgCanvas.getZoom();
        return zoomValue;
    });
    // console.log(result);
    expect(result).toEqual(0.256047619047619);//56%
    const zoomRatio = await app.client.$('div.zoom-ratio');
    await zoomRatio.getText();
    expect(await zoomRatio.getText()).toEqual('56%');

    const zoomOut1 = await app.client.$('div.zoom-btn.zoom-out');
    await zoomOut1.click();
    const result1 = await app.client.execute(() => {
        const zoomValue = svgCanvas.getZoom();
        return zoomValue;
    });
    expect(result1).toEqual(0.22662538699690402);//50%
    const zoomRatio1 = await app.client.$('div.zoom-ratio');
    await zoomRatio1.getText();
    expect(await zoomRatio1.getText()).toEqual('50%');

    const zoomOut2 = await app.client.$('div.zoom-btn.zoom-out');
    await zoomOut2.click();
    const result2 = await app.client.execute(() => {
        const zoomValue = svgCanvas.getZoom();
        return zoomValue;
    });
    expect(result2).toEqual(0.18130030959752325);//40%
    const zoomRatio2 = await app.client.$('div.zoom-ratio');
    await zoomRatio2.getText();
    expect(await zoomRatio2.getText()).toEqual('40%');

    const zoomOut3 = await app.client.$('div.zoom-btn.zoom-out');
    await zoomOut3.click();
    const result3 = await app.client.execute(() => {
        const zoomValue = svgCanvas.getZoom();
        return zoomValue;
    });
    expect(result3).toEqual(0.1359752321981424);//30%
    const zoomRatio3 = await app.client.$('div.zoom-ratio');
    await zoomRatio3.getText();
    expect(await zoomRatio3.getText()).toEqual('30%');
});
