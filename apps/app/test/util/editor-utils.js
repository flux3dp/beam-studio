const application = require('../test');

const pageCoordtoCanvasCoord = async (point = {x: 0, y: 0}) => {
    const { app } = application;
    const pt = await app.client.execute((x, y) => {
        const svgcontent = document.getElementById('svgcontent');
        const transformMatrix = svgcontent.getScreenCTM().inverse();
        const pt = svgedit.math.transformPoint(x, y, transformMatrix);
        return pt;
    }, point.x, point.y);
    return pt;
};

const getCurrentZoom = async () => {
    const { app } = application;
    const zoom = await app.client.execute(() => {
        return svgCanvas.getZoom();
    });
    return zoom;
};

module.exports = { pageCoordtoCanvasCoord, getCurrentZoom };