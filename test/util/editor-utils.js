const application = require('../test');

const pageCoordtoCanvasCoord = async (point = {x: 0, y: 0}) => {
    const { app } = application;
    const result = await app.client.execute((x, y) => {
        const svgcontent = document.getElementById('svgcontent');
        const transformMatrix = svgcontent.getScreenCTM().inverse();
        const pt = svgedit.math.transformPoint(x, y, transformMatrix);
        return pt;
    }, point.x, point.y);
    const pt = result.value;
    return pt;
};

const getCurrentZoom = async () => {
    const { app } = application;
    const result = await app.client.execute(() => {
        return svgCanvas.getZoom();
    });
    const zoom = result.value;
    return zoom;
};

module.exports = { pageCoordtoCanvasCoord, getCurrentZoom };
